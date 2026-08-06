class AuditLogMiddleware:
    MUTATING_METHODS = {"POST", "PUT", "PATCH", "DELETE"}

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        response = self.get_response(request)
        user = getattr(request, "user", None)
        if (
            getattr(user, "is_authenticated", False)
            and request.method in self.MUTATING_METHODS
            and request.path.startswith("/api/")
            and response.status_code < 500
        ):
            self._write_log(request, response)
        return response

    def _write_log(self, request, response):
        try:
            from apps.audit.models import AuditLog

            forwarded_for = request.META.get("HTTP_X_FORWARDED_FOR")
            ip_address = forwarded_for.split(",")[0].strip() if forwarded_for else request.META.get("REMOTE_ADDR")
            parts = [part for part in request.path.strip("/").split("/") if part]
            resource_type = parts[2] if len(parts) > 2 else ""
            AuditLog.objects.create(
                actor=request.user,
                action=f"{request.method} {request.resolver_match.view_name if request.resolver_match else request.path}",
                resource_type=resource_type,
                resource_id=parts[-1] if parts else "",
                ip_address=ip_address,
                user_agent=request.META.get("HTTP_USER_AGENT", ""),
                metadata={"status_code": response.status_code, "path": request.path},
            )
        except Exception:
            pass
