from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status

from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import permission_classes

from .models import Timetable
from .serializers import TimetableSerializer


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def add_timetable(request):

    serializer = TimetableSerializer(data=request.data)

    if serializer.is_valid():

        serializer.save()

        return Response({
            "message": "Timetable added successfully"
        })

    return Response(
        serializer.errors,
        status=status.HTTP_400_BAD_REQUEST
    )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_timetable(request):
    school_class_id = request.query_params.get('school_class')
    section_id = request.query_params.get('section')
    teacher_id = request.query_params.get('teacher')

    timetable = Timetable.objects.all()
    if school_class_id:
        timetable = timetable.filter(school_class_id=school_class_id)
    if section_id:
        timetable = timetable.filter(section_id=section_id)
    if teacher_id:
        timetable = timetable.filter(teacher_id=teacher_id)

    serializer = TimetableSerializer(
        timetable,
        many=True
    )

    return Response(serializer.data)