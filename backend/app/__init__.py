from flask import Flask
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from flask_migrate import Migrate
from app.config import Config
from app.models import db

migrate = Migrate()
jwt = JWTManager()

def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)
    app.url_map.strict_slashes = False
    
    CORS(app, origins=[
        "https://ai-crm-platform-steel.vercel.app",
        "http://localhost:5173",
        "http://localhost:3000",
    ])

    db.init_app(app)
    migrate.init_app(app, db)
    jwt.init_app(app)

    # Ensure templates.thumbnail is TEXT (PostgreSQL) or ignored (SQLite)
    with app.app_context():
        try:
            db.session.execute(db.text("ALTER TABLE templates ALTER COLUMN thumbnail TYPE TEXT;"))
            db.session.commit()
        except Exception:
            db.session.rollback()

    # Register blueprints (stubs to be implemented)
    from app.routes import bp as routes_bp
    from app.routes.command_center import bp as command_center_bp
    app.register_blueprint(routes_bp, url_prefix='/api', strict_slashes=False)
    app.register_blueprint(command_center_bp, strict_slashes=False)

    @app.route('/health')
    def health():
        return {'status': 'ok'}

    return app
