from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status

from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import permission_classes

from accounts.permissions import IsAdmin, IsTeacher

from .models import Attendance
from .serializers import AttendanceSerializer


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def mark_attendance(request):

    serializer = AttendanceSerializer(data=request.data)

    if serializer.is_valid():

        serializer.save()

        return Response({
            "message": "Attendance marked successfully"
        })

    return Response(
        serializer.errors,
        status=status.HTTP_400_BAD_REQUEST
    )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_attendance(request):
    student_id = request.query_params.get('student')
    school_class_id = request.query_params.get('school_class')
    section_id = request.query_params.get('section')

    attendance = Attendance.objects.select_related('student__user', 'marked_by').all()

    if student_id:
        attendance = attendance.filter(student_id=student_id)
    if school_class_id:
        attendance = attendance.filter(student__school_class_id=school_class_id)
    if section_id:
        attendance = attendance.filter(student__section_id=section_id)

    serializer = AttendanceSerializer(
        attendance,
        many=True
    )

    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def student_attendance(request, student_id):

    attendance = Attendance.objects.select_related('student__user', 'marked_by').filter(
        student_id=student_id
    )

    serializer = AttendanceSerializer(
        attendance,
        many=True
    )

    return Response(serializer.data)