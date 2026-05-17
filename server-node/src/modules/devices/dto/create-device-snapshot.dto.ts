import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateDeviceSnapshotDto {
  @ApiPropertyOptional({ example: 'iPhone 15', description: '设备名称。' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  deviceName?: string;

  @ApiPropertyOptional({ example: 'on', description: '屏幕状态。' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  screenStatus?: string;

  @ApiPropertyOptional({ example: '80', description: '屏幕亮度。' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  screenLevel?: string;

  @ApiPropertyOptional({ example: 'charging', description: '电池状态。' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  batteryStatus?: string;

  @ApiPropertyOptional({ example: '76', description: '电量。' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  batteryLevel?: string;

  @ApiPropertyOptional({ example: '40', description: '音量。' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  volumeLevel?: string;

  @ApiPropertyOptional({ example: 'on', description: '蓝牙状态。' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  bluetoothStatus?: string;

  @ApiPropertyOptional({ example: 'AirPods', description: '蓝牙设备名称。' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  bluetoothName?: string;

  @ApiPropertyOptional({ example: 'on', description: 'Wi-Fi 状态。' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  wifiStatus?: string;

  @ApiPropertyOptional({ example: 'Home WiFi', description: 'Wi-Fi 名称。' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  wifiName?: string;

  @ApiPropertyOptional({ example: 'enabled', description: 'GPS 状态。' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  gpsStatus?: string;

  @ApiPropertyOptional({
    example: 'gps',
    description:
      '位置来源。旧字段 locationFrom 在新 API 中改名为 locationSource。',
  })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  locationSource?: string;

  @ApiPropertyOptional({ example: '北京市朝阳区', description: '位置地址。' })
  @IsOptional()
  @IsString()
  locationAddress?: string;

  @ApiPropertyOptional({ example: 116.4074, description: '位置经度。' })
  @IsOptional()
  @IsNumber()
  locationLongitude?: number;

  @ApiPropertyOptional({ example: 39.9042, description: '位置纬度。' })
  @IsOptional()
  @IsNumber()
  locationLatitude?: number;
}
