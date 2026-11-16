import os
from flask import Flask, jsonify
from flask_cors import CORS
from dotenv import load_dotenv

load_dotenv()

from routes.categories import categories_bp
from routes.suppliers import suppliers_bp
from routes.employees import employees_bp
from routes.customers import customers_bp
from routes.products import products_bp
from routes.inventory import inventory_bp
from routes.orders import orders_bp
from routes.dashboard import dashboard_bp


def create_app():
    app = Flask(__name__)

    # In production, set FRONTEND_URL to your deployed frontend's exact URL
    # (comma-separated if you have more than one, e.g. a Render static site
    # URL and a custom domain). Left unset, it allows any origin, which is
    # fine for local development.
    frontend_urls = os.environ.get("FRONTEND_URL")
    origins = [u.strip() for u in frontend_urls.split(",")] if frontend_urls else "*"
    CORS(app, origins=origins)

    app.register_blueprint(categories_bp)
    app.register_blueprint(suppliers_bp)
    app.register_blueprint(employees_bp)
    app.register_blueprint(customers_bp)
    app.register_blueprint(products_bp)
    app.register_blueprint(inventory_bp)
    app.register_blueprint(orders_bp)
    app.register_blueprint(dashboard_bp)

    @app.get("/")
    @app.get("/api/health")
    def health():
        return jsonify({"success": True, "message": "Cuts & Co. API is running"})

    return app


app = create_app()

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port, debug=True)
