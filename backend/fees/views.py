from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status

from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import permission_classes

from .models import Fee
from .serializers import FeeSerializer


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def add_fee(request):
    if request.user.role != 'admin':
        return Response(
            {"error": "Permission denied. Only admins can record payments and fee items."},
            status=status.HTTP_403_FORBIDDEN
        )

    serializer = FeeSerializer(data=request.data)

    if serializer.is_valid():

        serializer.save()

        return Response({
            "message": "Fee added successfully"
        })

    return Response(
        serializer.errors,
        status=status.HTTP_400_BAD_REQUEST
    )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_fees(request):
    student_id = request.query_params.get('student')
    school_class_id = request.query_params.get('school_class')
    section_id = request.query_params.get('section')

    # Role-based restriction
    if request.user.role == 'student':
        if not hasattr(request.user, 'student_profile'):
            return Response([])
        fees = Fee.objects.select_related('student__user').filter(student=request.user.student_profile)
    elif request.user.role == 'admin':
        fees = Fee.objects.select_related('student__user').all()
        if student_id:
            fees = fees.filter(student_id=student_id)
        if school_class_id:
            fees = fees.filter(student__school_class_id=school_class_id)
        if section_id:
            fees = fees.filter(student__section_id=section_id)
    else:
        # Teachers should not be checking tuition fees ledger
        return Response(
            {"error": "Permission denied. Teachers cannot access the financial ledger."},
            status=status.HTTP_403_FORBIDDEN
        )

    serializer = FeeSerializer(
        fees,
        many=True
    )

    return Response(serializer.data)