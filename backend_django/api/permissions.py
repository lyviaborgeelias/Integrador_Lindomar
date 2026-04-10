from rest_framework.permissions import BasePermission, SAFE_METHODS

class IsAdminOrReadOnlyByTipo(BasePermission):
    def has_permission(self, request, view):
        if request.method in SAFE_METHODS:
            return True

        return (
            request.user.is_authenticated and
            hasattr(request.user, "tipo") and
            request.user.tipo == "ADMIN"
        )