from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status

from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import permission_classes

from accounts.utils import log_action

from .models import Mark
from .serializers import MarkSerializer


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def add_mark(request):
    if request.user.role not in ['admin', 'teacher']:
        return Response(
            {"error": "Permission denied. Only admins and teachers can add exam marks."},
            status=status.HTTP_403_FORBIDDEN
        )

    serializer = MarkSerializer(data=request.data)

    if serializer.is_valid():

        mark = serializer.save()
        try:
            log_action(
                user=request.user,
                action="ADD_MARK",
                details=f"Added {mark.exam_type} mark for {mark.student.user.email if mark.student.user else mark.student.admission_number} in {mark.subject.name}: {mark.marks_obtained}/{mark.total_marks}",
                request=request
            )
        except Exception:
            pass

        return Response({
            "message": "Marks added successfully"
        })

    return Response(
        serializer.errors,
        status=status.HTTP_400_BAD_REQUEST
    )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_marks(request):
    student_id = request.query_params.get('student')
    school_class_id = request.query_params.get('school_class')
    section_id = request.query_params.get('section')

    marks = Mark.objects.select_related('student__user', 'subject', 'graded_by').all()

    # Role-based restriction
    if request.user.role == 'student':
        if hasattr(request.user, 'student_profile'):
            marks = marks.filter(student=request.user.student_profile)
        else:
            return Response([])
    else:
        # Admins and teachers can filter
        if student_id:
            marks = marks.filter(student_id=student_id)
        if school_class_id:
            marks = marks.filter(student__school_class_id=school_class_id)
        if section_id:
            marks = marks.filter(student__section_id=section_id)

    serializer = MarkSerializer(
        marks,
        many=True
    )

    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def student_marks(request, student_id):
    # Role-based restriction
    if request.user.role == 'student':
        if not hasattr(request.user, 'student_profile') or request.user.student_profile.id != student_id:
            return Response(
                {"error": "Permission denied. You can only view your own marks."},
                status=status.HTTP_403_FORBIDDEN
            )

    marks = Mark.objects.select_related('student__user', 'subject', 'graded_by').filter(
        student_id=student_id
    )

    serializer = MarkSerializer(
        marks,
        many=True
    )

    return Response(serializer.data)