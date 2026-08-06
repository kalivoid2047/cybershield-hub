from rest_framework.views import exception_handler


def custom_exception_handler(exc, context):
    response = exception_handler(exc, context)
    if response is None:
        return response

    details = response.data
    message = "Request failed"
    if isinstance(details, dict):
        if "detail" in details:
            message = str(details["detail"])
        elif details:
            first_key = next(iter(details))
            message = f"{first_key}: {details[first_key]}"
    elif isinstance(details, list) and details:
        message = str(details[0])

    response.data = {
        "success": False,
        "error": {
            "code": getattr(exc, "default_code", response.status_code),
            "message": message,
            "details": details,
        },
    }
    return response
