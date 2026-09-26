import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiOkResponse,
  ApiCreatedResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { VenueService, VenueListResponseDto } from '../services/venue.service';
import { CreateVenueDto } from '../dtos/create-venue.dto';
import { UpdateVenueDto } from '../dtos/update-venue.dto';
import { VenueResponseDto } from '../dtos/venue-response.dto';
import { VenueListQueryDto } from '../dtos/venue-list-query.dto';
import { JwtAuthGuard } from '../../../shared/guards/jwt-auth.guard';
import { RolesGuard } from '../../../shared/guards/roles.guard';
import { Roles } from '../../../shared/decorators/roles.decorator';

@Controller('venues')
@ApiTags('Catalog - Venues')
@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
export class VenueController {
  constructor(private readonly venueService: VenueService) { }

  @Get()
  @ApiOperation({ summary: 'Get list of venues with search & city filter' })
  @ApiOkResponse({ type: VenueListResponseDto })
  async getVenues(@Query() query: VenueListQueryDto) {
    return this.venueService.getVenues(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get venue details by id' })
  @ApiParam({ name: 'id', description: 'Venue ID (UUID)' })
  @ApiOkResponse({ type: VenueResponseDto })
  async getVenue(@Param('id') id: string) {
    return this.venueService.getVenueById(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Admin', 'SuperAdmin', 'Organizer')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new venue template (Admin/Organizer)' })
  @ApiCreatedResponse({ type: VenueResponseDto })
  async createVenue(@Body() payload: CreateVenueDto) {
    return this.venueService.createVenue(payload);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Admin', 'SuperAdmin', 'Organizer')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update an existing venue (Admin/Organizer)' })
  @ApiParam({ name: 'id', description: 'Venue ID (UUID)' })
  @ApiOkResponse({ type: VenueResponseDto })
  async updateVenue(@Param('id') id: string, @Body() payload: UpdateVenueDto) {
    return this.venueService.updateVenue(id, payload);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Admin', 'SuperAdmin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a venue (Admin/SuperAdmin only)' })
  @ApiParam({ name: 'id', description: 'Venue ID (UUID)' })
  @ApiOkResponse({ type: VenueResponseDto })
  async deleteVenue(@Param('id') id: string) {
    return this.venueService.deleteVenue(id);
  }
}
