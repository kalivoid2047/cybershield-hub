from rest_framework.response import Response


def ok(data=None, message="OK", status=200):
    payload = {"success": True, "message": message}
    if data is not None:
        payload["data"] = data
    return Response(payload, status=status)
