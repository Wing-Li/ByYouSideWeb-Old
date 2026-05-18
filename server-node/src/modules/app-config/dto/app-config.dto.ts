import { ApiProperty } from '@nestjs/swagger';
import { VipPlanDto } from '../../vip/dto/vip-plan.dto';

export class AppConfigDto {
  @ApiProperty({ example: '1', description: '配置 ID。' })
  id!: string;

  @ApiProperty({ example: 'development', description: '配置所属环境。' })
  environment!: string;

  @ApiProperty({ example: '伴你左右', description: 'App 名称。' })
  appName!: string;

  @ApiProperty({
    example: false,
    description: '审核模式开关。false 表示审核模式，true 表示正常模式。',
  })
  unCheckMode!: boolean;

  @ApiProperty({
    type: [VipPlanDto],
    description: 'App 启动时展示的 VIP 套餐列表。',
  })
  vipTypeList!: VipPlanDto[];

  @ApiProperty({
    example: '2026-05-18T00:00:00.000Z',
    description: '创建时间。',
  })
  createdAt!: string;

  @ApiProperty({
    example: '2026-05-18T00:00:00.000Z',
    description: '更新时间。',
  })
  updatedAt!: string;
}
