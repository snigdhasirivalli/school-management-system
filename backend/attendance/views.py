from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status

from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import permission_classes

from accounts.permissions import IsAdmin, IsTeacher

from accounts.utils import log_action

from .models import Attendance
from .serializers import AttendanceSerializer


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def mark_attendance(request):
    if request.user.role != 'teacher':
        return Response(
            {"error": "Permission denied. Only teachers can mark attendance."},
            status=status.HTTP_403_FORBIDDEN
        )

    serializer = AttendanceSerializer(data=request.data)

    if serializer.is_valid():

        attendance = serializer.save()
        try:
            log_action(
                user=request.user,
                action="MARK_ATTENDANCE",
                details=f"Marked {attendance.student.user.email if attendance.student.user else attendance.student.admission_number} as {attendance.status} for {attendance.date}",
                request=request
            )
        except Exception:
            pass

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

    # Role-based restriction
    if request.user.role == 'student':
        if hasattr(request.user, 'student_profile'):
            attendance = attendance.filter(student=request.user.student_profile)
        else:
            return Response([])
    else:
        # Admins and teachers can filter as usual
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
    # Role-based restriction
    if request.user.role == 'student':
        if not hasattr(request.user, 'student_profile') or request.user.student_profile.id != student_id:
            return Response(
                {"error": "Permission denied. You can only view your own attendance."},
                status=status.HTTP_403_FORBIDDEN
            )

    attendance = Attendance.objects.select_related('student__user', 'marked_by').filter(
        student_id=student_id
    )

    serializer = AttendanceSerializer(
        attendance,
        many=True
    )

    return Response(serializer.data)