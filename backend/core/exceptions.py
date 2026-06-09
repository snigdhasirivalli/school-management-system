from rest_framework.views import exception_handler
from rest_framework.response import Response
from rest_framework import status
from django.conf import settings
import logging

logger = logging.getLogger(__name__)

def custom_exception_handler(exc, context):
    # Call REST framework's default exception handler first to get the standard error response.
    response = exception_handler(exc, context)

    if response is not None:
        # Standard validation or DRF exception
        detail = response.data.get('detail', None)
        
        if response.status_code == 400 and not detail:
            error_message = "Validation failed."
            error_details = response.data
        else:
            error_message = str(detail) if detail else "API Error"
            error_details = response.data

        response.data = {
            "success": False,
            "error": {
                "code": response.status_code,
                "message": error_message,
                "details": error_details
            }
        }
    else:
        # Unexpected server error (500)
        logger.error("Unhandled server exception: %s", str(exc), exc_info=exc)
        
        error_message = "An unexpected error occurred on the server."
        error_details = None
        
        if settings.DEBUG:
            error_message = str(exc)
            import traceback
            error_details = traceback.format_exc()
            
        response = Response({
            "success": False,
            "error": {
                "code": 500,
                "message": error_message,
                "details": error_details
            }
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    return response
