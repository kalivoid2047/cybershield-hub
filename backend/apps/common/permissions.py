from rest_framework.permissions import BasePermission, SAFE_METHODS


ADMIN = "system_admin"
USER = "normal_user"


def role_code(user):
    if not user or not user.is_authenticated:
        return None
    if user.is_superuser:
        return ADMIN
    role = getattr(user, "role", None)
    return getattr(role, "code", None)


class IsSystemAdmin(BasePermission):
    def has_permission(self, request, view):
        return role_code(request.user) == ADMIN


class IsAdminOrReadOnly(BasePermission):
    def has_permission(self, request, view):
        if request.method in SAFE_METHODS:
            return bool(request.user and request.user.is_authenticated)
        return role_code(request.user) == ADMIN


class IsOwnerOrAdmin(BasePermission):
    def has_object_permission(self, request, view, obj):
        if role_code(request.user) == ADMIN:
            return True
        owner = getattr(obj, "user", None) or getattr(obj, "reporter", None)
        return owner == request.user
