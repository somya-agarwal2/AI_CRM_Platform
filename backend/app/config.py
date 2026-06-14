import os

basedir = os.path.abspath(os.path.dirname(__file__))

class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'super-secret-key'
    # Accept DATABASE_URL (Render default) or DATABASE_URI (manually set)
    _db_url = os.environ.get('DATABASE_URL') or os.environ.get('DATABASE_URI')
    # Render provides postgres:// but SQLAlchemy needs postgresql://
    if _db_url and _db_url.startswith('postgres://'):
        _db_url = _db_url.replace('postgres://', 'postgresql://', 1)
    SQLALCHEMY_DATABASE_URI = _db_url or \
        'sqlite:///' + os.path.join(basedir, '..', 'ai_crm_v2.db')
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    JWT_SECRET_KEY = os.environ.get('JWT_SECRET_KEY') or 'jwt-secret-key'
