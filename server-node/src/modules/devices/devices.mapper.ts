import { DeviceSnapshot, Prisma } from '@prisma/client';
import { DeviceSnapshotDto } from './dto/device-snapshot.dto';

type DeviceSnapshotSource = Pick<
  DeviceSnapshot,
  | 'id'
  | 'userId'
  | 'deviceName'
  | 'screenStatus'
  | 'screenLevel'
  | 'batteryStatus'
  | 'batteryLevel'
  | 'volumeLevel'
  | 'bluetoothStatus'
  | 'bluetoothName'
  | 'wifiStatus'
  | 'wifiName'
  | 'gpsStatus'
  | 'locationSource'
  | 'locationAddress'
  | 'locationLongitude'
  | 'locationLatitude'
  | 'createdAt'
>;

export function toDeviceSnapshotDto(
  snapshot: DeviceSnapshotSource,
): DeviceSnapshotDto {
  return {
    id: snapshot.id.toString(),
    userId: snapshot.userId.toString(),
    deviceName: snapshot.deviceName,
    screenStatus: snapshot.screenStatus,
    screenLevel: snapshot.screenLevel,
    batteryStatus: snapshot.batteryStatus,
    batteryLevel: snapshot.batteryLevel,
    volumeLevel: snapshot.volumeLevel,
    bluetoothStatus: snapshot.bluetoothStatus,
    bluetoothName: snapshot.bluetoothName,
    wifiStatus: snapshot.wifiStatus,
    wifiName: snapshot.wifiName,
    gpsStatus: snapshot.gpsStatus,
    locationSource: snapshot.locationSource,
    locationAddress: snapshot.locationAddress,
    locationLongitude: decimalToString(snapshot.locationLongitude),
    locationLatitude: decimalToString(snapshot.locationLatitude),
    createdAt: snapshot.createdAt.toISOString(),
  };
}

function decimalToString(value: Prisma.Decimal): string {
  return value.toString();
}
