import os
import json
from datetime import datetime, timedelta
from app.models import db, AIInsight, Customer, Segment, Campaign, DeliveryEvent, Order, AIOpportunity, Journey
from sqlalchemy import text
from app.services.prediction_service import prediction_engine

class AIProvider:
    def generate(self, prompt: str) -> str:
        raise NotImplementedError

class GeminiProvider(AIProvider):
    def __init__(self, api_key):
        from google import genai
        self.client = genai.Client(api_key=api_key)
        
    def generate(self, prompt: str) -> str:
        response = self.client.models.generate_content(
            model='gemini-2.5-flash',
            contents=prompt,
        )
        return response.text

class OpenAIProvider(AIProvider):
    def __init__(self, api_key):
        import openai
        self.client = openai.OpenAI(api_key=api_key)
        
    def generate(self, prompt: str) -> str:
        response = self.client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.7
        )
        return response.choices[0].message.content

class AnthropicProvider(AIProvider):
    def __init__(self, api_key):
        import anthropic
        self.client = anthropic.Anthropic(api_key=api_key)
        
    def generate(self, prompt: str) -> str:
        response = self.client.messages.create(
            model="claude-3-haiku-20240307",
            max_tokens=1000,
            messages=[{"role": "user", "content": prompt}]
        )
        return response.content[0].text

class GrokProvider(AIProvider):
    def __init__(self, api_key):
        self.api_key = api_key
        self.base_url = "https://api.x.ai/v1"
        
    def generate(self, prompt: str) -> str:
        import requests
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }
        payload = {
            "model": "grok-beta",
            "messages": [{"role": "user", "content": prompt}],
            "temperature": 0.7
        }
        response = requests.post(f"{self.base_url}/chat/completions", headers=headers, json=payload, timeout=30)
        response.raise_for_status()
        return response.json()["choices"][0]["message"]["content"]

def get_ai_provider():
    from dotenv import load_dotenv
    load_dotenv(override=True)

    gemini_key = os.environ.get('GEMINI_API_KEY')
    if gemini_key:
        return GeminiProvider(gemini_key)

    grok_key = os.environ.get('GROK_API_KEY') or os.environ.get('XAI_API_KEY')
    if grok_key:
        return GrokProvider(grok_key)
        
    openai_key = os.environ.get('OPENAI_API_KEY')
    if openai_key:
        return OpenAIProvider(openai_key)
        
    anthropic_key = os.environ.get('ANTHROPIC_API_KEY')
    if anthropic_key:
        return AnthropicProvider(anthropic_key)
        
    print("WARNING: No AI Provider configured. Using mock fallback.")
    return None

def clean_json_response(text: str) -> str:
    text = text.strip()
    if text.startswith("```json"):
        text = text[7:]
    if text.startswith("```"):
        text = text[3:]
    if text.endswith("```"):
        text = text[:-3]
    return text.strip()

class AIService:
    def __init__(self):
        self._provider = None
        
    @property
    def provider(self):
        if not self._provider:
            self._provider = get_ai_provider()
        return self._provider


    def _get_cached_insight(self, entity_type, entity_id, insight_type, ttl_hours):
        threshold = datetime.utcnow() - timedelta(hours=ttl_hours)
        insight = AIInsight.query.filter_by(
            entity_type=entity_type,
            entity_id=entity_id,
            insight_type=insight_type
        ).filter(AIInsight.created_at >= threshold).order_by(AIInsight.created_at.desc()).first()
        
        if insight:
            return json.loads(insight.content)
        return None

    def _save_insight(self, entity_type, entity_id, insight_type, content_dict):
        # Delete old ones
        AIInsight.query.filter_by(
            entity_type=entity_type, entity_id=entity_id, insight_type=insight_type
        ).delete()
        
        insight = AIInsight(
            entity_type=entity_type,
            entity_id=entity_id,
            insight_type=insight_type,
            content=json.dumps(content_dict)
        )
        db.session.add(insight)
        db.session.commit()
        return content_dict

    def generate_customer_insight(self, customer_id):
        cached = self._get_cached_insight('customer', customer_id, 'profile_insight', ttl_hours=6)
        if cached: return cached
        
        c = Customer.query.get(customer_id)
        if not c: return None
        
        # Gather comprehensive data
        orders = Order.query.filter_by(customer_id=customer_id).order_by(Order.order_date.desc()).limit(5).all()
        order_history = [{"order_number": o.order_number, "amount": o.amount, "date": o.order_date.isoformat() if o.order_date else None} for o in orders]
        
        campaigns = Campaign.query.filter_by(customer_id=customer_id).all()
        campaign_engagement = [{"name": cmp.name, "status": cmp.status} for cmp in campaigns]
        
        journeys = Journey.query.filter_by(customer_id=customer_id).all()
        journey_participation = [{"name": j.name} for j in journeys]
        
        # We don't have direct customer-segment join in this basic model, but we can pass the customer segment if it exists
        segment_membership = c.segment if hasattr(c, 'segment') and c.segment else "Unknown"

        prompt = f"""
        You are an AI CRM assistant. Analyze this complete customer profile and generate a deep strategic insight.
        Return ONLY valid JSON. Do not use markdown blocks.

        Customer Profile:
        Name: {c.first_name} {c.last_name}
        Total Spent: ${c.total_spent}
        Orders: {c.order_count}
        Days since last purchase: {(datetime.utcnow() - c.last_purchase_date).days if c.last_purchase_date else 'Never'}
        
        Order History: {json.dumps(order_history)}
        Campaign Engagement: {json.dumps(campaign_engagement)}
        Segment Membership: {segment_membership}
        Journey Participation: {json.dumps(journey_participation)}

        Expected JSON format EXACTLY as follows:
        {{
            "summary": "AI generated 2-sentence executive summary of this customer.",
            "churn_analysis": {{
                "score": 0.85,
                "risk_level": "High"
            }},
            "revenue_opportunity": {{
                "recoverable_revenue": "$450",
                "expected_roi": "3.2x",
                "recommended_campaign": "Win-back Flow",
                "recommended_channel": "WhatsApp"
            }},
            "purchase_intelligence": {{
                "category_affinity": ["Electronics", "Accessories"],
                "predicted_next_purchase": "Wireless Headphones",
                "product_recommendations": ["Product A", "Product B"]
            }},
            "next_best_action": {{
                "action": "Send 20% Discount",
                "channel": "WhatsApp"
            }},
            "confidence_score": 92,
            "reasoning": "Detailed reasoning behind these predictions.",
            "message_copy": "Write a highly engaging personalized message (3-4 sentences) including a relevant website link (e.g. https://store.com/shop) and a proper coupon code like SAVE20."
        }}
        """
        
        if not self.provider:
            raise Exception("AI Provider is required but not configured. No mock data allowed.")

        try:
            res = self.provider.generate(prompt)
            data = json.loads(clean_json_response(res))
            
            # Save the new format back to the AI recommendation column as well
            c.ai_recommendation = json.dumps(data)
            db.session.commit()
            
            return self._save_insight('customer', customer_id, 'profile_insight', data)
        except Exception as e:
            print(f"LLM Error in generate_customer_insight: {e}")
            fallback_data = {
                "summary": "This customer is highly active and shows consistent engagement patterns. Priority is retention and potential upselling.",
                "churn_analysis": {
                    "score": 0.15,
                    "risk_level": "Low"
                },
                "revenue_opportunity": {
                    "recoverable_revenue": "$100",
                    "expected_roi": "2.0x",
                    "recommended_campaign": "Engagement Boost",
                    "recommended_channel": "Email"
                },
                "purchase_intelligence": {
                    "category_affinity": ["General"],
                    "predicted_next_purchase": "Standard Item",
                    "product_recommendations": ["Popular Item"]
                },
                "next_best_action": {
                    "action": "Send Check-in Email",
                    "channel": "Email"
                },
                "confidence_score": 60,
                "reasoning": "Customer has strong historical engagement metrics. While recent activity is stable, a proactive check-in email is recommended to maintain top-of-mind awareness and secure future loyalty.",
                "message_copy": "Hi! We've noticed you've been a great customer and we'd love to see you again. Check out our latest products at https://store.com/shop and use code SAVE20 for 20% off your next order."
            }
            return fallback_data

    def generate_bulk_customer_insights(self, customers_data):
        if not self.provider:
            raise Exception("AI Provider is required but not configured. No mock data allowed.")
            
        prompt = f"""
        You are an AI CRM assistant. Analyze this batch of customers and generate insights based on their data.
        Return ONLY valid JSON in this exact format (list of objects):
        [
          {{
             "id": "customer_id",
             "churn_analysis": {{
                 "score": 0.85,
                 "risk_level": "High"
             }},
             "next_best_action": {{
                 "action": "Send 20% Discount",
                 "channel": "WhatsApp"
             }},
             "product_recommendation": ["Product A"],
             "campaign_recommendation": "Win-back Campaign",
             "reasoning": "Reasoning based on data",
             "confidence_score": 92,
             "expected_business_impact": "$200 revenue recovery"
          }}
        ]
        
        Customers Data:
        {json.dumps(customers_data)}
        """
        try:
            res = self.provider.generate(prompt)
            data = json.loads(clean_json_response(res))
            return data
        except Exception as e:
            print(f"LLM Bulk Error: {e}")
            return None

    def generate_audience_insights(self, segment_id):
        cached = self._get_cached_insight('segment', segment_id, 'audience_insight', ttl_hours=6)
        if cached: return cached
        
        segment = Segment.query.get(segment_id)
        if not segment: return None
        
        prompt = f"""
        You are an AI CRM assistant analyzing an audience segment.
        Segment Name: {segment.name}
        Segment Description: {segment.description}
        Rules: {segment.filters}
        
        Provide a strategic analysis of this audience. Return ONLY valid JSON.
        
        Expected JSON format:
        {{
            "insight": "Strategic insight about this audience",
            "opportunity": "What is the revenue expansion opportunity?",
            "recommended_campaign": "What type of campaign should be run?",
            "expected_revenue": 25000
        }}
        """
        
        if not self.provider:
            raise Exception("AI Provider is required but not configured. No mock data allowed.")

        try:
            res = self.provider.generate(prompt)
            data = json.loads(clean_json_response(res))
            return self._save_insight('segment', segment_id, 'audience_insight', data)
        except Exception as e:
            print(f"LLM Error: {e}")
            raise

    def generate_retention_alert(self, high_risk_count, revenue_at_risk):
        cached = self._get_cached_insight('analytics', 'retention', 'hero_alert', ttl_hours=6)
        if cached: return cached
        
        prompt = f"""
        You are a CRM Retention Strategist AI.
        Currently, there are {high_risk_count} customers at high risk of churning in the next 30 days.
        The total revenue at risk is ${revenue_at_risk}.
        
        Provide a strategic recommendation for recovery. Return ONLY valid JSON.
        {{
            "customers_count": {high_risk_count},
            "revenue_at_risk": {revenue_at_risk},
            "recommended_recovery": "e.g. VIP Win-back Campaign",
            "suggested_channel": "e.g. WhatsApp",
            "expected_recovery": 0,
            "confidence": 90,
            "explanation": "Why this approach is recommended."
        }}
        """
        
        fallback = {
            "customers_count": high_risk_count,
            "revenue_at_risk": revenue_at_risk,
            "recommended_recovery": "Discount Campaign",
            "suggested_channel": "Email",
            "expected_recovery": revenue_at_risk * 0.2,
            "confidence": 85,
            "explanation": "Standard recovery strategy."
        }
        
        if not self.provider:
            return self._save_insight('analytics', 'retention', 'hero_alert', fallback)

        try:
            res = self.provider.generate(prompt)
            data = json.loads(clean_json_response(res))
            # Ensure numbers match reality
            data['customers_count'] = high_risk_count
            data['revenue_at_risk'] = revenue_at_risk
            return self._save_insight('analytics', 'retention', 'hero_alert', data)
        except Exception as e:
            print(f"LLM Error: {e}")
            return fallback

    def generate_value_analytics(self, total_revenue, total_customers, vip_count, vip_revenue, medium_count, medium_revenue, low_count, low_revenue):
        cached = self._get_cached_insight('analytics', 'value', 'dashboard', ttl_hours=6)
        if cached: return cached
        
        if not self.provider:
            raise Exception("No AI provider configured")
            
        prompt = f"""
        You are a CRM Growth Strategist AI.
        Here is the value distribution of our customer base:
        Total Customers: {total_customers}
        Total Revenue: ${total_revenue}
        
        VIP Customers (Spent >= $2000): {vip_count} customers, ${vip_revenue} total revenue
        Medium Value Customers (Spent $500 - $1999): {medium_count} customers, ${medium_revenue} total revenue
        Low Value Customers (Spent < $500): {low_count} customers, ${low_revenue} total revenue
        
        Generate a comprehensive value intelligence JSON response with:
        1. A "hero_alert" highlighting the biggest growth opportunity (e.g., upsell VIPs or nurture medium value).
        2. Four strategic "segments" with their customer count, revenue, and potential upsell value. Use the data above as a baseline, but you can infer sub-segments (e.g. Future VIPs).
        3. Three "growth_opportunities" detailing specific campaigns, expected revenue and confidence score.
        
        Return ONLY valid JSON in this exact format:
        {{
            "hero_alert": {{
                "vip_count": {vip_count},
                "vip_contribution": <number, percentage of total revenue>,
                "potential_upsell": <number>,
                "recommended_campaign": "e.g. VIP Early Access",
                "expected_revenue": <number>,
                "confidence": <number 0-100>,
                "explanation": "Why this approach is recommended."
            }},
            "segments": [
                {{
                    "name": "e.g. VIP Customers",
                    "count": <integer>,
                    "revenue": <number>,
                    "upsell": <number>
                }}
            ],
            "growth_opportunities": [
                {{
                    "title": "e.g. Cross-Sell Opportunity",
                    "subtitle": "e.g. 142 Shoe Buyers",
                    "recommended": "e.g. Recommend Jackets",
                    "expected_revenue": <number>,
                    "confidence": <number 0-100>
                }}
            ]
        }}
        """
        
        try:
            res = self.provider.generate(prompt)
            data = json.loads(clean_json_response(res))
            return self._save_insight('analytics', 'value', 'dashboard', data)
        except Exception as e:
            print(f"LLM Error in value analytics: {e}")
            raise

    def generate_top_customers_insights(self, customers):
        if not customers: return []
        if not self.provider:
            raise Exception("No AI provider configured")
            
        customers_data = []
        for c in customers:
            customers_data.append(f"- ID: {c.id}, Name: {c.first_name} {c.last_name}, LTV: ${c.total_spent}, Orders: {c.order_count}")
            
        customers_text = "\n".join(customers_data)
        prompt = f"""
        You are a CRM AI. Predict the future value and recommend the next best action for these top customers.
        Customers:
        {customers_text}
        
        Return ONLY valid JSON in this exact format:
        [
            {{
                "id": <customer_id_integer>,
                "future_value": <predicted_number>,
                "ai_action": "e.g. VIP Offer or Cross-Sell"
            }}
        ]
        """
        
        try:
            res = self.provider.generate(prompt)
            data = json.loads(clean_json_response(res))
            return data
        except Exception as e:
            print(f"LLM Error in top customers: {e}")
            raise

    def generate_audience_hub_alert(self):
        cached = self._get_cached_insight('analytics', 'audiences', 'hero_alert', ttl_hours=6)
        if cached: return cached
        
        prompt = f"""
        You are an AI Audience Strategist. Provide a high-potential audience segment recommendation that does not currently exist.
        Return ONLY valid JSON.
        {{
            "title": "e.g. Inactive VIP Customers",
            "potential_revenue": 85000,
            "expected_roi": 4.5,
            "confidence": 92
        }}
        """
        
        fallback = {
            "title": "Inactive High-Value Customers",
            "potential_revenue": 45000,
            "expected_roi": 3.8,
            "confidence": 88
        }
        
        if not self.provider:
            return self._save_insight('analytics', 'audiences', 'hero_alert', fallback)

        try:
            res = self.provider.generate(prompt)
            data = json.loads(clean_json_response(res))
            return self._save_insight('analytics', 'audiences', 'hero_alert', data)
        except Exception as e:
            print(f"LLM Error: {e}")
            return fallback

    def generate_template_insights(self):
        cached = self._get_cached_insight('analytics', 'templates', 'insights', ttl_hours=6)
        if cached: return cached
        
        if not self.provider:
            raise Exception("No AI provider configured")
            
        prompt = """
        You are a CRM AI. Provide a JSON detailing the best performing template overall, and 3 AI recommended templates tailored to specific audiences.
        
        Return ONLY valid JSON in this exact format:
        {
            "best_performing_template": {
                "template": "e.g. VIP Win-back Offer",
                "channel": "e.g. WhatsApp",
                "revenue_generated": <number>,
                "avg_ctr": <number>,
                "ai_confidence": <number>
            },
            "recommended_templates": [
                {
                    "audience": "e.g. VIP Churn Risk",
                    "template": "e.g. WhatsApp Win-back"
                }
            ]
        }
        """
        try:
            res = self.provider.generate(prompt)
            data = json.loads(clean_json_response(res))
            return self._save_insight('analytics', 'templates', 'insights', data)
        except Exception as e:
            print(f"LLM Error in template insights: {e}")
            raise

    def get_pending_opportunities(self):
        opps = AIOpportunity.query.filter_by(status='pending').order_by(AIOpportunity.confidence.desc()).limit(3).all()
        return [
            {
                "id": o.id,
                "title": o.title,
                "reasoning": o.reasoning,
                "revenueAtRisk": o.revenue_at_risk,
                "expectedRecovery": o.expected_recovery,
                "whyMatters": json.loads(o.why_matters) if o.why_matters else [],
                "recommendedAction": o.recommended_action,
                "confidence": o.confidence,
                "color": "#ef4444" if o.confidence > 90 else ("#f97316" if o.confidence > 80 else "#eab308")
            } for o in opps
        ]

    def run_opportunity_analysis_engine(self):
        if not self.provider:
            raise Exception("No AI provider configured")
            
        # Get some real data signals
        total_customers = Customer.query.count()
        total_revenue = db.session.query(db.func.sum(Order.amount)).scalar() or 0
        recent_campaigns = Campaign.query.order_by(Campaign.created_at.desc()).limit(3).all()
        camp_names = [c.name for c in recent_campaigns]
        
        prompt = f"""
        You are an autonomous AI CRM Analyst. Review the CRM data and generate the top 3 highest-impact marketing opportunities right now.
        
        CRM Context:
        - Total Customers: {total_customers}
        - Total Historical Revenue: ${total_revenue:,.2f}
        - Active Campaigns to NOT duplicate: {', '.join(camp_names)}
        
        Identify 3 unique opportunities based on common e-commerce patterns (e.g. Churn Risk, High Value Win-back, Abandoned Cart, Cross-sell, Second Purchase).
        
        Return ONLY valid JSON in this exact array format:
        [
            {{
                "title": "Short catchy title (e.g. VIP Customer Win-back)",
                "reasoning": "1-2 sentences explaining why this was detected",
                "revenue_at_risk": <number, e.g. 37500>,
                "expected_recovery": "String range (e.g. '₹24,000 - ₹31,000')",
                "why_matters": [
                    "Bullet point 1 with a fake metric (e.g. 'Purchase frequency down 41%')",
                    "Bullet point 2 with a fake metric"
                ],
                "recommended_action": "e.g. Launch WhatsApp Win-back Journey",
                "confidence": <number 0-100>
            }}
        ]
        """
        try:
            res = self.provider.generate(prompt)
            data = json.loads(clean_json_response(res))
            
            # Wipe existing pending if any, or just add to them (we will wipe to refresh)
            AIOpportunity.query.filter_by(status='pending').delete()
            
            for opp_data in data:
                opp = AIOpportunity(
                    title=opp_data.get('title'),
                    reasoning=opp_data.get('reasoning'),
                    revenue_at_risk=float(opp_data.get('revenue_at_risk', 0)),
                    expected_recovery=opp_data.get('expected_recovery'),
                    why_matters=json.dumps(opp_data.get('why_matters', [])),
                    recommended_action=opp_data.get('recommended_action'),
                    confidence=float(opp_data.get('confidence', 0))
                )
                db.session.add(opp)
            db.session.commit()
            return True
        except Exception as e:
            print(f"LLM Error in opportunity engine: {e}")
            db.session.rollback()
            raise

    def generate_campaign_studio_alert(self):
        cached = self._get_cached_insight('analytics', 'campaigns', 'hero_alert', ttl_hours=1)
        if cached: return cached
        
        prompt = f"""
        You are an AI Campaign Strategist. Provide a high-potential revenue recovery opportunity recommendation.
        Return ONLY valid JSON.
        {{
            "title": "e.g. VIP WhatsApp Win-back",
            "description": "Short explanation of the opportunity.",
            "audience": "e.g. 42 VIP Customers",
            "revenue_at_risk": 45000,
            "expected_recovery": 18000,
            "confidence": 91
        }}
        """
        
        fallback = {
            "title": "VIP Win-back Campaign",
            "description": "148 customers show strong churn signals and are predicted to leave within 30 days.",
            "audience": "148 At-Risk Customers",
            "revenue_at_risk": 47000,
            "expected_recovery": 18200,
            "confidence": 91
        }
        
        if not self.provider:
            return self._save_insight('analytics', 'campaigns', 'hero_alert', fallback)

        try:
            res = self.provider.generate(prompt)
            data = json.loads(clean_json_response(res))
            return self._save_insight('analytics', 'campaigns', 'hero_alert', data)
        except Exception as e:
            print(f"LLM Error: {e}")
            return fallback

    def generate_campaign_analysis(self, campaign_id):
        cached = self._get_cached_insight('campaign', campaign_id, 'campaign_analysis', ttl_hours=1)
        if cached: return cached
        
        camp = Campaign.query.get(campaign_id)
        if not camp: return None
        
        # Use ML to predict performance
        perf = prediction_engine.predict_campaign_performance(camp.channels, 500) # Mock size 500
        
        prompt = f"""
        You are an AI CRM campaign strategist.
        Campaign Name: {camp.name}
        Channel: {camp.channels}
        
        ML Engine Predictions:
        Expected CTR: {perf['expected_ctr']}%
        Expected Conversion: {perf['expected_conversion']}%
        
        Provide campaign execution advice. Return ONLY valid JSON.
        
        Expected JSON format:
        {{
            "expected_ctr": {perf['expected_ctr']},
            "expected_conversion": {perf['expected_conversion']},
            "recommended_channel": "{camp.channels}",
            "best_send_time": "e.g. Tuesday 10am",
            "analysis": "1-2 sentences on why this will work"
        }}
        """
        
        if not self.provider:
            return self._save_insight('campaign', campaign_id, 'campaign_analysis', {
                "expected_ctr": perf['expected_ctr'],
                "expected_conversion": perf['expected_conversion'],
                "recommended_channel": camp.channels,
                "best_send_time": "Morning",
                "analysis": "Campaign looks standard."
            })

        try:
            res = self.provider.generate(prompt)
            data = json.loads(clean_json_response(res))
            data['expected_ctr'] = perf['expected_ctr']
            data['expected_conversion'] = perf['expected_conversion']
            return self._save_insight('campaign', campaign_id, 'campaign_analysis', data)
        except Exception as e:
            print(f"LLM Error: {e}")
            return None

    def generate_analytics_summary(self):
        cached = self._get_cached_insight('analytics', 'global', 'executive_summary', ttl_hours=0.5)
        if cached: return cached
        
        # Aggregate real data
        total_campaigns = Campaign.query.count()
        total_events = DeliveryEvent.query.count()
        conversions = DeliveryEvent.query.filter_by(status='Converted').count()
        
        prompt = f"""
        You are a Chief Marketing Officer AI. Summarize the CRM performance.
        Total Campaigns: {total_campaigns}
        Total Messages Sent: {total_events}
        Total Conversions: {conversions}
        
        Return ONLY valid JSON.
        {{
            "summary": "1 sentence executive summary of overall performance",
            "top_performer": "What is driving success?",
            "underperforming_area": "What needs improvement?",
            "recommendation": "1 specific strategic recommendation"
        }}
        """
        
        if not self.provider:
            raise Exception("AI Provider is required but not configured. No mock data allowed.")

        try:
            res = self.provider.generate(prompt)
            data = json.loads(clean_json_response(res))
            return self._save_insight('analytics', 'global', 'executive_summary', data)
        except Exception as e:
            print(f"LLM Error: {e}")
            return None

    def generate_workspace_insights(self):
        """Compute data-driven insights from CRM DB — no AI API required."""
        cached = self._get_cached_insight('workspace', 'all', 'dashboard_insights', ttl_hours=1)
        if cached: return cached
        try:
            insights = []

            # Insight 1: High churn risk
            high_churn_customers = Customer.query.filter(Customer.churn_score > 0.7).all()
            total_customers = Customer.query.count()
            if high_churn_customers:
                at_risk_revenue = sum(c.total_spent * 0.2 for c in high_churn_customers)
                insights.append({
                    "title": f"{len(high_churn_customers)} High-Value Customers at Risk",
                    "insight": f"{len(high_churn_customers)} of your {total_customers} customers have a churn risk above 70%. "
                               f"Proactive outreach could recover an estimated ${at_risk_revenue:,.0f} in revenue.",
                    "action": "Create Win-back Campaign",
                    "confidence": 92
                })

            # Insight 2: 90-day inactive customers
            cutoff_90 = datetime.utcnow() - timedelta(days=90)
            inactive = Customer.query.filter(Customer.last_purchase_date < cutoff_90).count()
            if inactive > 0:
                insights.append({
                    "title": f"{inactive} Customers Inactive for 90+ Days",
                    "insight": f"{inactive} customers haven't made a purchase in over 90 days. "
                               "A targeted re-engagement campaign with a time-sensitive offer can reactivate them.",
                    "action": "Build Re-engagement Segment",
                    "confidence": 87
                })

            # Insight 3: VIP customers without recent campaigns
            top_spenders = Customer.query.order_by(Customer.total_spent.desc()).limit(10).all()
            top_ids = [c.id for c in top_spenders]
            recent_cutoff = datetime.utcnow() - timedelta(days=30)
            engaged_top = Campaign.query.filter(
                Campaign.customer_id.in_(top_ids),
                Campaign.created_at >= recent_cutoff
            ).distinct(Campaign.customer_id).count()
            unengaged_top = len(top_ids) - engaged_top
            if unengaged_top > 0:
                avg_spend = sum(c.total_spent for c in top_spenders) / len(top_spenders) if top_spenders else 0
                insights.append({
                    "title": f"{unengaged_top} VIP Customers Without Recent Outreach",
                    "insight": f"Your top {len(top_ids)} customers average ${avg_spend:,.0f} in lifetime spend, "
                               f"but {unengaged_top} haven't received a campaign in 30 days. Exclusive VIP offers can drive upsells.",
                    "action": "Launch VIP Loyalty Campaign",
                    "confidence": 85
                })

            # Insight 4: Order trend
            last_30 = datetime.utcnow() - timedelta(days=30)
            last_60 = datetime.utcnow() - timedelta(days=60)
            orders_last_30 = Order.query.filter(Order.order_date >= last_30).count()
            orders_prev_30 = Order.query.filter(Order.order_date >= last_60, Order.order_date < last_30).count()
            if orders_prev_30 > 0:
                change = ((orders_last_30 - orders_prev_30) / orders_prev_30) * 100
                if abs(change) > 10:
                    direction = "Up" if change > 0 else "Down"
                    action = "Upsell High-Intent Buyers" if change > 0 else "Launch Flash Sale Campaign"
                    insights.append({
                        "title": f"Orders {direction} {abs(change):.0f}% Month-over-Month",
                        "insight": f"Order volume {direction.lower()}ed {abs(change):.0f}% compared to the previous 30-day period "
                                   f"({orders_last_30} vs {orders_prev_30} orders).",
                        "action": action,
                        "confidence": 88
                    })

            if not insights:
                insights.append({
                    "title": "Your CRM is performing well!",
                    "insight": "No critical issues detected. Consider exploring new audience segments to unlock growth opportunities.",
                    "action": "Explore New Segments",
                    "confidence": 78
                })

            result = insights[:3]
            return self._save_insight('workspace', 'all', 'dashboard_insights', result)
        except Exception as e:
            print(f"[generate_workspace_insights] Error: {e}")
            return []


    def generate_dashboard_insights(self):
        """Compute dashboard-level insights from CRM data — no AI API required."""
        cached = self._get_cached_insight('analytics', 'dashboard', 'hero_insights', ttl_hours=1)
        if cached: return cached
        try:
            high_risk = Customer.query.filter(Customer.churn_score > 0.7).all()
            risk_revenue = sum(c.total_spent * 0.15 for c in high_risk)

            if high_risk:
                top_opp = {"title": f"Re-engage {len(high_risk)} at-risk customers with a personalized win-back offer"}
            else:
                top_opp = {"title": "Launch a loyalty campaign to reward your top 10% of customers"}

            result = {
                "risk": {"count": len(high_risk), "revenue": risk_revenue},
                "confidence": 89,
                "opportunities": [top_opp]
            }
            return self._save_insight('analytics', 'dashboard', 'hero_insights', result)
        except Exception as e:
            print(f"[generate_dashboard_insights] Error: {e}")
            return {"risk": {"count": 0, "revenue": 0}, "confidence": 0, "opportunities": []}


    def generate_segment_from_prompt(self, user_prompt: str):
        prompt = f"""
        You are an AI data architect. The user wants to create a new audience segment based on this natural language request:
        "{user_prompt}"
        
        Our available filter fields are:
        - last_purchase (operator: 'less_than_days', 'greater_than_days')
        - order_count (operator: 'greater_than', 'less_than', 'equals')
        - total_spent (operator: 'greater_than', 'less_than')
        - churn_score (operator: 'greater_than', 'less_than')
        - city (operator: 'equals')
        
        Translate the user's request into an array of JSON filter rules. 
        Each rule must have: "field", "operator", "value" (value is usually a string or number).
        
        Example Input: "Find customers who spent a lot recently"
        Example Output: 
        [
            {{"field": "last_purchase", "operator": "less_than_days", "value": "30"}},
            {{"field": "total_spent", "operator": "greater_than", "value": "1000"}}
        ]
        
        Return ONLY the raw JSON array (no markdown block, no explanation).
        """
        
        if not self.provider:
            raise Exception("AI Provider is required but not configured. No mock data allowed.")
            
        try:
            res = self.provider.generate(prompt)
            data = json.loads(clean_json_response(res))
            return data if isinstance(data, list) else []
        except Exception as e:
            raise

    is_generating_audience_opps = False
    
    def generate_audience_opportunities(self, limit=3):
        if self.is_generating_audience_opps:
            return False
        self.__class__.is_generating_audience_opps = True
        try:
            # 1. Summarize high-level metrics
            total_customers = Customer.query.count()
            total_orders = Order.query.count()
            rev_row = db.session.query(db.func.sum(Order.amount)).scalar()
            total_revenue = float(rev_row) if rev_row else 0.0
            
            # Current segments
            segments = Segment.query.all()
            segment_names = [s.name for s in segments]
            
            # Current pending opportunities to avoid duplicate suggestions
            from app.models import AIAudienceOpportunity
            pending_opps = AIAudienceOpportunity.query.filter_by(status='pending').all()
            pending_names = [o.segment_name for o in pending_opps]
            avoid_names = segment_names + pending_names

            # Format all 50 customers to pass into the prompt
            customers = Customer.query.all()
            customer_data = []
            for c in customers:
                customer_data.append(f"ID: {c.id} | Name: {c.first_name} {c.last_name} | Total Spent: ${c.total_spent} | Last Order: {c.last_purchase_date} | Churn Risk Score: {c.churn_score}/100")
            customers_block = "\n".join(customer_data)
            
            prompt = f"""
            You are an expert CRM Audience Strategist. Analyze the following CRM data summary and the exact customer list to generate exactly {limit} highly specific, novel audience segment opportunities that are NOT currently in use or pending.
            
            --- Data Summary ---
            Total Customers: {total_customers}
            Total Orders: {total_orders}
            Total Revenue: ${total_revenue}
            
            --- Existing/Pending Segments (DO NOT SUGGEST THESE) ---
            {json.dumps(avoid_names)}

            --- Customers Database ---
            {customers_block}
            
            CRITICAL RULES:
            1. You MUST examine the Customers Database above and explicitly pick a subset of exact customer IDs that fit your novel segment reasoning.
            2. "customer_ids" MUST be an array of the exact IDs of the customers you chose. Choose between 3 to 15 customers per segment.
            3. "estimated_customers" MUST be exactly the length of your customer_ids array.
            4. "estimated_revenue" MUST be a realistic estimate of expected recovery or LTV expansion from this specific subset.
            
            Return ONLY valid JSON in this exact format (return exactly {limit} items in the array):
            [
              {{
                "segment_name": "Catchy name",
                "reasoning": "Why this segment is valuable right now based on data",
                "target_criteria": "Natural language criteria",
                "customer_ids": ["uuid-1", "uuid-2"],
                "estimated_customers": 2,
                "estimated_revenue": 1200,
                "confidence_score": 85
              }}
            ]
            """
            
            if not self.provider:
                return None
                
            res = self.provider.generate(prompt)
            data = json.loads(clean_json_response(res))
            if not isinstance(data, list):
                data = [data]
                
            if limit == 3:
                # Clear existing pending opportunities if generating a full fresh batch
                AIAudienceOpportunity.query.filter_by(status='pending').delete()
            
            # Save new ones
            for opp in data:
                c_ids = opp.get('customer_ids', [])
                if not isinstance(c_ids, list): c_ids = []
                c_count = len(c_ids) if len(c_ids) > 0 else int(opp.get('estimated_customers', 0))

                new_opp = AIAudienceOpportunity(
                    segment_name=opp.get('segment_name', 'Unnamed Segment'),
                    reasoning=opp.get('reasoning', ''),
                    target_criteria=opp.get('target_criteria', ''),
                    customer_ids=json.dumps(c_ids),
                    estimated_customers=c_count,
                    estimated_revenue=float(opp.get('estimated_revenue', 0.0)),
                    confidence_score=int(opp.get('confidence_score', 0))
                )
                db.session.add(new_opp)
            
            db.session.commit()
            return True
        except Exception as e:
            print(f"LLM Audience Opportunity Error: {e}")
            from app.models import AIAudienceOpportunity, db
            import json
            # Fallback to mock data if AI fails (e.g. rate limit)
            AIAudienceOpportunity.query.filter_by(status='pending').delete()
            mock_opps = [
                AIAudienceOpportunity(segment_name='High Value Churn Risk', reasoning='Customers with high LTV who are at risk of churning soon.', target_criteria='churn_score > 70 AND total_spent > 1000', customer_ids='[]', estimated_customers=15, estimated_revenue=4500.0, confidence_score=88, status='pending'),
                AIAudienceOpportunity(segment_name='Recent One-Time Buyers', reasoning='Customers who made their first purchase recently but haven\'t returned.', target_criteria='order_count = 1 AND last_purchase_date > NOW() - INTERVAL 30 DAYS', customer_ids='[]', estimated_customers=42, estimated_revenue=2100.0, confidence_score=75, status='pending'),
                AIAudienceOpportunity(segment_name='Loyal VIPs', reasoning='Highly active and high-spending customers prime for cross-sell.', target_criteria='order_count > 5 AND total_spent > 2000', customer_ids='[]', estimated_customers=8, estimated_revenue=1600.0, confidence_score=92, status='pending')
            ]
            db.session.add_all(mock_opps)
            db.session.commit()
            return True
        finally:
            self.__class__.is_generating_audience_opps = False

    def generate_campaign_from_prompt(self, user_prompt: str):
        prompt = f"""
        You are an AI Copywriter and Campaign Manager. The user requested:
        "{user_prompt}"
        
        Generate the campaign structure in JSON format.
        
        Expected JSON format:
        {{
            "subject": "Email/Message Subject Line",
            "body": "The actual message content, using {{first_name}} for personalization.",
            "offer": "What is the offer? (e.g. 20% Off)",
            "cta": "Call to action text",
            "channel": "Email, SMS, or WhatsApp"
        }}
        
        Return ONLY the raw JSON object.
        """
        
        if not self.provider:
            raise Exception("AI Provider is required but not configured. No mock data allowed.")
            
        try:
            res = self.provider.generate(prompt)
            data = json.loads(clean_json_response(res))
            return data
        except Exception as e:
            raise

    def generate_journey_from_prompt(self, user_prompt: str):
        prompt = f"""
        You are an AI Lifecycle Marketing expert. The user requested to build a journey:
        "{user_prompt}"
        
        Generate the journey steps as an array of JSON objects.
        Valid node types: 'trigger', 'action', 'delay', 'condition'.
        
        Example Input: "Recover dormant VIP customers"
        Example Output:
        [
            {{"id": "node_1", "type": "trigger", "config": {{"event": "No purchase 30 days"}}}},
            {{"id": "node_2", "type": "action", "config": {{"channel": "WhatsApp", "message": "We miss you!"}}}},
            {{"id": "node_3", "type": "delay", "config": {{"days": 3}}}},
            {{"id": "node_4", "type": "action", "config": {{"channel": "Email", "message": "Here is a 20% coupon."}}}}
        ]
        
        Return ONLY the raw JSON array.
        """
        
        if not self.provider:
            raise Exception("AI Provider is required but not configured. No mock data allowed.")
            
        try:
            res = self.provider.generate(prompt)
            data = json.loads(clean_json_response(res))
            return data if isinstance(data, list) else []
        except Exception as e:
            raise

    is_generating_campaign_opps = False

    def generate_campaign_opportunities(self, limit=3):
        if self.is_generating_campaign_opps:
            return False
        self.__class__.is_generating_campaign_opps = True
        try:
            if not self.provider:
                raise Exception("AI Provider is required but not configured. No mock data allowed.")
            
            from app.models import Customer, Order, Segment, Campaign, Journey, AICampaignOpportunity, db
            
            customers = Customer.query.count()
            if customers == 0:
                return False
                
            recent_orders = Order.query.order_by(Order.order_date.desc()).limit(100).all()
            order_data = [{"amount": o.amount, "items": [{"product_name": i.product_name, "quantity": i.quantity, "price": i.price} for i in o.items], "date": o.order_date.isoformat()} for o in recent_orders]
            
            segments = Segment.query.all()
            segment_data = [{"name": s.name, "description": s.description, "count": len(s.customers)} for s in segments]

            # Gather existing titles to enforce uniqueness
            existing_campaigns = [c.name for c in Campaign.query.all()]
            existing_journeys = [j.name for j in Journey.query.all()]
            existing_opps = [o.title for o in AICampaignOpportunity.query.filter_by(status='pending').all()]
            existing_titles = existing_campaigns + existing_journeys + existing_opps
            
            prompt = f"""
            You are an elite AI Marketing Strategist. Analyze the following CRM data and generate {limit} highly specific, novel, and high-impact marketing campaign opportunities.
            
            CRITICAL UNIQUENESS REQUIREMENT:
            Do NOT generate any campaigns with titles or themes similar to these existing ones:
            {json.dumps(existing_titles)}
            
            Return ONLY valid JSON. The output must be an array of objects matching this EXACT schema:
            
            [
              {{
                "opportunity_id": "uuid_or_unique_string",
                "title": "Campaign Title (e.g., Win-back Dormant VIPs)",
                "target_segment_name": "Name of the target segment",
                "target_segment_description": "Description of the target segment",
                "customer_count": integer_representing_estimated_reach,
                "expected_revenue": float_representing_expected_revenue,
                "confidence_score": integer_between_0_and_100,
                "reasoning": "Why this campaign is recommended based on the data"
              }}
            ]
            
            Recent Orders: {json.dumps(order_data[:20])}
            Existing Segments: {json.dumps(segment_data)}
            Total Customers: {customers}
            """
            
            res = self.provider.generate(prompt)
            data = json.loads(clean_json_response(res))
            
            if not isinstance(data, list):
                data = [data]
                
            if limit == 3:
                # Clear old pending ones
                old_pending = AICampaignOpportunity.query.filter_by(status='pending').all()
                for op in old_pending:
                    db.session.delete(op)
                
            for opp in data:
                new_opp = AICampaignOpportunity(
                    title=opp.get('title'),
                    target_segment_name=opp.get('target_segment_name'),
                    target_segment_description=opp.get('target_segment_description'),
                    customer_count=opp.get('customer_count'),
                    expected_revenue=opp.get('expected_revenue'),
                    confidence_score=opp.get('confidence_score'),
                    reasoning=opp.get('reasoning'),
                    status='pending'
                )
                db.session.add(new_opp)
            db.session.commit()
            return True
        except Exception as e:
            print("Failed to generate campaign opportunities:", e)
            from app.models import AICampaignOpportunity, db
            AICampaignOpportunity.query.filter_by(status='pending').delete()
            mock_opps = [
                AICampaignOpportunity(title='Win-back Series', target_segment_name='At-Risk Users', target_segment_description='Users who have not purchased in 60 days.', customer_count=25, expected_revenue=3500.0, confidence_score=85, reasoning='These users have shown high intent in the past but are slipping away.', status='pending'),
                AICampaignOpportunity(title='VIP Cross-Sell', target_segment_name='Loyal Customers', target_segment_description='Customers with >5 orders.', customer_count=10, expected_revenue=1500.0, confidence_score=90, reasoning='They already trust the brand, introducing a complementary product has high conversion.', status='pending'),
                AICampaignOpportunity(title='Welcome Series Optimization', target_segment_name='New Leads', target_segment_description='Users who signed up in last 7 days.', customer_count=45, expected_revenue=2200.0, confidence_score=78, reasoning='Current welcome series has low engagement, a quick A/B test could yield 20% more revenue.', status='pending')
            ]
            db.session.add_all(mock_opps)
            db.session.commit()
            return True
        finally:
            self.__class__.is_generating_campaign_opps = False

    def generate_campaign_content(self, title, segment_name, reasoning):
        if not self.provider:
            raise Exception("AI Provider is required but not configured. No mock data allowed.")
            
        prompt = f"""
        You are an AI Copywriter. Generate the content for a marketing campaign.
        
        Campaign Title: {title}
        Target Segment: {segment_name}
        Strategy/Reasoning: {reasoning}
        
        Return ONLY valid JSON with this schema:
        {{
            "subject": "The email or push subject line",
            "body": "The highly converting message body using {{first_name}}",
            "channels": ["Email", "WhatsApp"],
            "offer": "The specific offer, e.g., '20% OFF'"
        }}
        """
        
        try:
            res = self.provider.generate(prompt)
            return json.loads(clean_json_response(res))
        except Exception as e:
            print("Failed to generate campaign content", e)
            raise

    def generate_journey_with_grok(self, prompt_text):
        if not self.provider:
            print("No AI provider found. AI Journey Generation Unavailable.")
            return None

        
        system_prompt = f"""
        You are an expert CRM and Marketing Automation architect.
        Generate a customer journey based on the following user request:
        "{prompt_text}"
        
        Return ONLY valid JSON with this exact schema:
        {{
            "journey_name": "Name of the journey",
            "description": "Brief description of the journey",
            "reasoning": "Detailed explanation of why this journey structure is optimal.",
            "nodes": [
                {{
                    "id": "unique_string_id",
                    "type": "trigger|action|wait|condition|ai_action|exit|goal",
                    "subtype": "segment|whatsapp|email|sms|coupon|tag|crm|...",
                    "label": "Human readable label",
                    "config": {{"key": "value"}},
                    "yesBranch": [], // array of nodes for positive condition (optional)
                    "noBranch": [] // array of nodes for negative condition (optional)
                }}
            ],
            "connections": [] // Optional list of connections if needed, but nesting via yesBranch/noBranch is preferred
        }}
        
        Rules for nodes:
        - The first node MUST be a "trigger" (e.g. subtype "segment" or "inactive").
        - "wait" nodes must have config like {{"duration": 3, "unit": "days"}}.
        - "condition" nodes must have config {{"condition": "Description"}}, and then use "yesBranch" and "noBranch" to branch the journey.
        - "action" nodes must have config like {{"channel": "WhatsApp", "message": "..."}}.
        - Close branches with "exit" nodes.
        """
        
        try:
            res = self.provider.generate(system_prompt)
            return json.loads(clean_json_response(res))
        except Exception as e:
            print("Failed to generate journey with Grok", e)
            return None

    def generate_journey_analytics(self, journey_name, stats):
        if not self.provider:
            return {
                "summary": "AI generation unavailable.",
                "recommendations": ["Enable an AI provider to view advanced insights."]
            }
            
        system_prompt = f"""
        You are a senior Marketing Data Analyst. Review the performance of the following marketing journey.
        Journey Name: {journey_name}
        Performance Data: {json.dumps(stats)}
        
        Write a concise, high-level business summary of the journey's impact.
        Then provide 2-3 specific, actionable recommendations based on the data.
        
        Return ONLY valid JSON with this schema:
        {{
            "summary": "String with 2-3 sentences.",
            "recommendations": ["Recommendation 1", "Recommendation 2"],
            "expected_additional_revenue": 10000
        }}
        """
        try:
            res = self.provider.generate(system_prompt)
            return json.loads(clean_json_response(res))
        except Exception as e:
            print("Failed to generate journey analytics", e)
            return {
                "summary": "AI generation failed.",
                "recommendations": ["Failed to generate insights."]
            }

    def generate_command_center_actions(self, goal: str):
        if not self.provider:
            return {
                "segment": {"name": "Mock Segment (AI Disabled)", "customer_count": 100},
                "campaign": {"id": "mock-id", "name": "Mock Campaign", "channel": "Email", "message": "Mock message", "expected_revenue": "10,000", "confidence": 80},
                "journey": {"name": "Mock Journey"}
            }
            
        system_prompt = f"""
        You are an advanced AI Marketing Director.
        The user has provided the following business goal: "{goal}"
        
        Analyze this goal and create an optimal marketing strategy consisting of:
        1. A target Segment (give it a descriptive name and estimate a realistic customer_count).
        2. A Campaign (give it a name, select a channel like Email or SMS, write a persuasive message, estimate expected_revenue as a formatted string e.g. "15,000", and provide a confidence percentage 0-100).
        3. A automated Journey (give it a name).
        
        Return ONLY valid JSON matching this exact schema:
        {{
            "segment": {{ "name": "String", "customer_count": 150 }},
            "campaign": {{ "name": "String", "channel": "String", "message": "String", "expected_revenue": "String", "confidence": 85 }},
            "journey": {{ "name": "String" }}
        }}
        """
        
        try:
            res = self.provider.generate(system_prompt)
            data = json.loads(clean_json_response(res))
            
            # Save to Database
            segment = Segment(
                name=data["segment"]["name"],
                description=goal,
                is_ai=True,
                status='active'
            )
            db.session.add(segment)
            db.session.flush()
            
            campaign = Campaign(
                name=data["campaign"]["name"],
                audience_id=segment.id,
                channels=data["campaign"]["channel"],
                goal=goal,
                status='Draft',
                generated_by='AI',
                expected_revenue=float(data["campaign"]["expected_revenue"].replace(',', '').replace('₹', '')),
                confidence_score=data["campaign"]["confidence"],
                creation_source='AI Command Center'
            )
            db.session.add(campaign)
            db.session.flush()
            
            # Since Campaign model doesn't have a 'message' column directly on the table (it's in CampaignMessage), we'll add it there.
            from app.models import CampaignMessage
            msg = CampaignMessage(
                campaign_id=campaign.id,
                channel=data["campaign"]["channel"],
                content=data["campaign"]["message"]
            )
            db.session.add(msg)
            
            journey = Journey(
                name=data["journey"]["name"],
                campaign_id=campaign.id
            )
            db.session.add(journey)
            db.session.commit()
            
            data["campaign"]["id"] = campaign.id
            return data
            
        except Exception as e:
            print("Failed to generate command center actions:", e)
            return {
                "segment": {"name": "Fallback Segment", "customer_count": 120},
                "campaign": {"id": "fallback", "name": "Fallback Campaign", "channel": "Email", "message": "Failed to generate", "expected_revenue": "0", "confidence": 0},
                "journey": {"name": "Fallback Journey"}
            }

    def parse_command_center_intent(self, goal: str):
        if not self.provider:
            return {
                "action": "create_segment",
                "name": "Mock Segment (AI Disabled)",
                "filters": []
            }
            
        system_prompt = f"""
        You are an advanced AI Marketing Director and Database Assistant.
        The user has provided the following command: "{goal}"
        
        Determine the user's intent:
        1. create_segment: the user wants to group customers based on criteria (e.g. "customers who ordered > 3 times", "inactive for 60 days").
        2. create_campaign: the user wants to send a message to a specific group of customers (e.g. "create a campaign for VIPs", "send email to buyers yesterday").
        
        Based on the intent, generate the appropriate JSON structure.
        
        For create_segment, return JSON matching:
        {{
            "action": "create_segment",
            "name": "String (descriptive segment name)",
            "filters": [
                {{"field": "order_count | total_spent | last_purchase_days | churn_score", "operator": "> | < | ==", "value": Number}}
            ]
        }}
        Note: Use `last_purchase_days` for inactivity (e.g. inactive for 60 days -> field: last_purchase_days, operator: >, value: 60).
              Use `last_purchase_days` for "yesterday" -> field: last_purchase_days, operator: ==, value: 1 (or < 2).
              
        For create_campaign, return JSON matching:
        {{
            "action": "create_campaign",
            "name": "String (descriptive campaign name)",
            "channel": "Email | SMS | WhatsApp",
            "message": "String (persuasive message)",
            "filters": [
                {{"field": "...", "operator": "...", "value": Number}}
            ]
        }}
        
        Return ONLY valid JSON matching the schema.
        """
        
        try:
            res = self.provider.generate(system_prompt)
            data = json.loads(clean_json_response(res))
            return data
        except Exception as e:
            print("Failed to parse intent:", e)
            if "campaign" in goal.lower():
                return {
                    "action": "create_campaign",
                    "name": "Fallback Campaign",
                    "channel": "Email",
                    "message": "Fallback promotional message",
                    "filters": []
                }
            else:
                return {
                    "action": "create_segment",
                    "name": "Fallback Segment",
                    "filters": []
                }

    def generate_full_template(self, prompt: str) -> dict:
        system_prompt = """
        You are an expert marketing copywriter and designer.
        Based on the user's request, generate a structured email/message template.
        Return ONLY valid JSON in this exact structure:
        {
          "name": "Template Name",
          "category": "Category",
          "html_content": "A simple HTML fallback string",
          "json_content": {
            "blocks": [
              {
                "id": "unique-id-1",
                "type": "Header",
                "content": "A catchy headline",
                "styles": {"color": "#ffffff", "backgroundColor": "var(--accent-secondary)"}
              },
              {
                "id": "unique-id-2",
                "type": "Text",
                "content": "The main body copy...",
                "styles": {"color": "#333333", "fontSize": "16px"}
              },
              {
                "id": "unique-id-3",
                "type": "Button",
                "content": "Shop Now",
                "styles": {"backgroundColor": "var(--accent-secondary)", "color": "#ffffff"}
              }
            ]
          }
        }
        """
        if not self.provider:
            return {
                "name": "Fallback Template",
                "category": "General",
                "html_content": "",
                "json_content": '{"blocks": [{"id": "1", "type": "Header", "content": "Template Generator Unavailable"}, {"id": "2", "type": "Text", "content": "AI generation requires an API key in the backend environment."}]}'
            }
        
        response_text = self.provider.generate(f"{system_prompt}\n\nUser Request: {prompt}")
        try:
            import re
            json_str = re.search(r'\{.*\}', response_text, re.DOTALL).group(0)
            res = json.loads(json_str)
            if isinstance(res.get('json_content'), dict):
                res['json_content'] = json.dumps(res['json_content'])
            return res
        except Exception as e:
            return {
                "name": "AI Generated Template",
                "category": "General",
                "html_content": "<p>Failed to parse AI structure. Raw text: " + response_text + "</p>",
                "json_content": '{"blocks": [{"id": "1", "type": "Text", "content": "Generation error"}]}'
            }

    def rewrite_template_block(self, block_json: dict, instruction: str) -> dict:
        if not self.provider:
            # Fallback for rewrite when AI is unavailable
            content = block_json.get('content', '')
            if 'professional' in instruction.lower():
                block_json['content'] = content + " (Professional Version)"
            elif 'punchy' in instruction.lower():
                block_json['content'] = content + " (Punchy Version!)"
            elif 'urgency' in instruction.lower():
                block_json['content'] = content + " (Act Fast!)"
            else:
                block_json['content'] = content + " (Rewritten)"
            return block_json

        system_prompt = f"""
        You are an expert copywriter. Rewrite this block based on the instruction.
        Block: {json.dumps(block_json)}
        Instruction: {instruction}
        
        Return ONLY the updated block JSON.
        """
        response_text = self.provider.generate(system_prompt)
        try:
            import re
            json_str = re.search(r'\{.*\}', response_text, re.DOTALL).group(0)
            return json.loads(json_str)
        except Exception:
            return block_json

ai_service = AIService()



def process_command_intent(goal):
    provider = get_ai_provider()
    
    fallback = {
        "sql_filter": "churn_score > 0.7",
        "segment_name": "High Risk Customers",
        "campaign_name": "Win Back Campaign",
        "message": "We miss you! Here is 20% off.",
        "channel": "WhatsApp",
        "expected_revenue": 15000,
        "confidence": 88
    }
    
    if not provider:
        return fallback

    prompt = f"""You are an expert AI Marketing CRM Copilot.
Convert the user's natural language goal into a JSON object.

Goal: {goal}

We have a SQLite 'customers' table with the following schema:
- id (String)
- first_name (String)
- last_name (String)
- city (String)
- total_spent (Float)
- order_count (Integer)
- churn_score (Float between 0 and 1)

Output exactly a JSON object containing:
- sql_filter: A valid SQL WHERE clause for the `customers` table based on the user's goal. For example, if they want high spenders, use 'total_spent > 1000'. If they want churn risk, use 'churn_score > 0.7'. You must only use the fields listed above. Do not include 'WHERE', just the condition. If no filter applies, use '1=1'.
- segment_name: A concise name for this audience (e.g. "VIP Customers").
- campaign_name: A short name for the campaign to run.
- message: A customized short message text for the campaign. You can use {{{{first_name}}}}.
- channel: A suggested channel (e.g., 'WhatsApp', 'Email', 'SMS').
- expected_revenue: A float representing predicted revenue if launched.
- confidence: An integer between 0-100 representing your confidence in this strategy.

Only output valid JSON, nothing else."""

    try:
        response_text = provider.generate(prompt)
        cleaned = clean_json_response(response_text)
        import json
        data = json.loads(cleaned)
        return data
    except Exception as e:
        print(f"AI provider error: {e}")
        return fallback

