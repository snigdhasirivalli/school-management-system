from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status

from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import permission_classes

from .models import Notification
from .serializers import NotificationSerializer


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def send_notification(request):

    serializer = NotificationSerializer(data=request.data)

    if serializer.is_valid():

        serializer.save()

        return Response({
            "message": "Notification sent successfully"
        })

    return Response(
        serializer.errors,
        status=status.HTTP_400_BAD_REQUEST
    )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_notifications(request):

    notifications = Notification.objects.all().order_by('-created_at')

    serializer = NotificationSerializer(
        notifications,
        many=True
    )

    return Response(serializer.data)