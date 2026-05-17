import { ApiProperty } from '@nestjs/swagger';

export class DeviceSnapshotDto {
  @ApiProperty({
    example: '1',
    description: '设备快照 ID，使用字符串承载 BigInt。',
  })
  id!: string;

  @ApiProperty({ example: '10000', description: '所属用户 ID。' })
  userId!: string;

  @ApiProperty({ example: 'iPhone 15', description: '设备名称。' })
  deviceName!: string;

  @ApiProperty({ example: 'on', description: '屏幕状态。' })
  screenStatus!: string;

  @ApiProperty({ example: '80', description: '屏幕亮度。' })
  screenLevel!: string;

  @ApiProperty({ example: 'charging', description: '电池状态。' })
  batteryStatus!: string;

  @ApiProperty({ example: '76', description: '电量。' })
  batteryLevel!: string;

  @ApiProperty({ example: '40', description: '音量。' })
  volumeLevel!: string;

  @ApiProperty({ example: 'on', description: '蓝牙状态。' })
  bluetoothStatus!: string;

  @ApiProperty({ example: 'AirPods', description: '蓝牙设备名称。' })
  bluetoothName!: string;

  @ApiProperty({ example: 'on', description: 'Wi-Fi 状态。' })
  wifiStatus!: string;

  @ApiProperty({ example: 'Home WiFi', description: 'Wi-Fi 名称。' })
  wifiName!: string;

  @ApiProperty({ example: 'enabled', description: 'GPS 状态。' })
  gpsStatus!: string;

  @ApiProperty({ example: 'gps', description: '位置来源。' })
  locationSource!: string;

  @ApiProperty({ example: '北京市朝阳区', description: '位置地址。' })
  locationAddress!: string;

  @ApiProperty({ example: '116.4074000', description: '位置经度。' })
  locationLongitude!: string;

  @ApiProperty({ example: '39.9042000', description: '位置纬度。' })
  locationLatitude!: string;

  @ApiProperty({
    example: '2026-05-17T00:00:00.000Z',
    description: '创建时间。',
  })
  createdAt!: string;
}
