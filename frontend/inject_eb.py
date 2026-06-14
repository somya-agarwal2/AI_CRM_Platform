import sys

with open("src/components/CampaignStudio.tsx", "r", encoding="utf-8") as f:
    code = f.read()

eb_code = """
import React, { Component } from 'react';
class ErrorBoundary extends Component {
  constructor(props) { super(props); this.state = { hasError: false, error: null }; }
  static getDerivedStateFromError(error) { return { hasError: true, error }; }
  render() {
    if (this.state.hasError) {
      return <div style={{position:'fixed', top: 0, left: 0, zIndex: 9999, background: 'red', color: 'white', padding: '20px'}}>{this.state.error.toString()}<br/><pre>{this.state.error.stack}</pre></div>;
    }
    return this.props.children;
  }
}
"""

if "class ErrorBoundary" not in code:
    code = code.replace("import { useNavigate } from 'react-router-dom';", eb_code + "\nimport { useNavigate } from 'react-router-dom';")
    code = code.replace("{selectedCampaignForDetails && (", "{selectedCampaignForDetails && (<ErrorBoundary>")
    
    # We need to find the end of the modal to close the ErrorBoundary.
    # We know the end is `</button>\n            </div>\n\n          </div>\n        </div>\n      )}`
    # Let's just replace the exact end string:
    target_end = """              <button className="btn btn-primary" onClick={() => setSelectedCampaignForDetails(null)}>
                Close
              </button>
            </div>

          </div>
        </div>
      )}"""
    
    replacement_end = """              <button className="btn btn-primary" onClick={() => setSelectedCampaignForDetails(null)}>
                Close
              </button>
            </div>

          </div>
        </div>
        </ErrorBoundary>
      )}"""
      
    code = code.replace(target_end, replacement_end)

with open("src/components/CampaignStudio.tsx", "w", encoding="utf-8") as f:
    f.write(code)
