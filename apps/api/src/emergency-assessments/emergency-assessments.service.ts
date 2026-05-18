import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  EmergencyAssessmentStatus,
  Prisma,
} from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEmergencyAssessmentDto } from './dto/create-emergency-assessment.dto';
import { UpdateEmergencyAssessmentDto } from './dto/update-emergency-assessment.dto';

@Injectable()
export class EmergencyAssessmentsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createEmergencyAssessmentDto: CreateEmergencyAssessmentDto) {
    const registration = await this.ensureIgdRegistrationExists(
      createEmergencyAssessmentDto.registrationId,
    );

    try {
      return await this.prisma.emergencyAssessment.create({
        data: {
          registrationId: registration.id,
          chiefComplaint:
            createEmergencyAssessmentDto.chiefComplaint ??
            registration.chiefComplaint ??
            '',
        },
        include: this.emergencyAssessmentInclude(),
      });
    } catch (error) {
      this.handlePrismaUniqueConstraint(error);
      throw error;
    }
  }

  findAll() {
    return this.prisma.emergencyAssessment.findMany({
      include: this.emergencyAssessmentInclude(),
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOne(id: string) {
    const assessment = await this.prisma.emergencyAssessment.findUnique({
      where: { id },
      include: this.emergencyAssessmentInclude(),
    });

    if (!assessment) {
      throw new NotFoundException(
        `Emergency assessment with ID ${id} not found`,
      );
    }

    return assessment;
  }

  async findByRegistration(registrationId: string) {
    const assessment = await this.prisma.emergencyAssessment.findUnique({
      where: {
        registrationId,
      },
      include: this.emergencyAssessmentInclude(),
    });

    if (!assessment) {
      throw new NotFoundException(
        `Emergency assessment for registration ID ${registrationId} not found`,
      );
    }

    return assessment;
  }

  async update(
    id: string,
    updateEmergencyAssessmentDto: UpdateEmergencyAssessmentDto,
  ) {
    await this.findOne(id);

    return this.prisma.emergencyAssessment.update({
      where: { id },
      data: {
        ...updateEmergencyAssessmentDto,
        assessedAt:
          updateEmergencyAssessmentDto.status ===
          EmergencyAssessmentStatus.TRIAGE_COMPLETED
            ? new Date()
            : undefined,
      },
      include: this.emergencyAssessmentInclude(),
    });
  }

  async remove(id: string) {
    await this.findOne(id);

    return this.prisma.emergencyAssessment.delete({
      where: { id },
    });
  }

  private async ensureIgdRegistrationExists(registrationId: string) {
    const registration = await this.prisma.registration.findUnique({
      where: { id: registrationId },
      include: {
        clinic: true,
      },
    });

    if (!registration) {
      throw new NotFoundException(
        `Registration with ID ${registrationId} not found`,
      );
    }

    if (registration.clinic.code !== 'IGD') {
      throw new BadRequestException(
        'Emergency assessment hanya dapat dibuat untuk registrasi IGD',
      );
    }

    return registration;
  }

  private emergencyAssessmentInclude() {
    return {
      registration: {
        include: {
          patient: true,
          clinic: true,
          doctor: {
            include: {
              clinic: true,
            },
          },
        },
      },
    };
  }

  private handlePrismaUniqueConstraint(error: unknown): void {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    ) {
      throw new ConflictException(
        'Asesmen IGD untuk registrasi ini sudah dibuat',
      );
    }
  }
}
