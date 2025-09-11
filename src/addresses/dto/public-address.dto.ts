export class PublicAddressDto {
  id!: string;
  label?: string;
  areaRegion?: string;
  block?: string;
  street?: string;
  buildingNo?: string;
  floorNo?: string;
  apartmentNo?: string;
  isDefault!: boolean;
}
