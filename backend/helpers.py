"""Shared helpers for consistent API responses and error handling."""

from functools import wraps
from flask import jsonify


def ok(data=None, message="success", status=200):
    return jsonify({"success": True, "message": message, "data": data}), status


def fail(message="error", status=400):
    return jsonify({"success": False, "message": message, "data": None}), status


def handle_errors(fn):
    """Decorator that catches exceptions in a route and returns a clean JSON error."""

    @wraps(fn)
    def wrapper(*args, **kwargs):
        try:
            return fn(*args, **kwargs)
        except Exception as exc:  # noqa: BLE001 - we want a catch-all at the API boundary
            return fail(str(exc), 500)

    return wrapper
