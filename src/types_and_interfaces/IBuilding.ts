import { Timestamp } from "firebase/firestore";

export type percentBreakdownType = {
  30: number | null;
  40: number | null;
  50: number | null;
  60: number | null;
  65: number | null;
  70: number | null;
  75: number | null;
  80: number | null;
  85: number | null;
  90: number | null;
};

export type amiDataType = {
  micro: percentBreakdownType;
  studio: percentBreakdownType;
  oneBed: percentBreakdownType;
  twoBed: percentBreakdownType;
  threePlusBed: percentBreakdownType;
};

export default interface IBuilding {
  buildingID: string;
  dateCode: string;
  IDWithDateCode: string;
  buildingName: string;
  phone: string | null;
  phone2: string | null;
  residentialTargetedArea: string;
  totalRestrictedUnits: 0 | string;
  sedu: 0 | string;
  studioUnits: 0 | string;
  oneBedroomUnits: 0 | string;
  twoBedroomUnits: 0 | string;
  threePlusBedroomUnits: 0 | string;
  urlForBuilding: string;
  lat: number | null;
  lng: number | null;
  streetNum: string;
  street: string;
  city: string;
  state: string;
  zip: string;
  updatedTimestamp: Timestamp;

  streetAddress: string;
  amiData: amiDataType;
}

export type originalFieldsType = {
  buildingID: string;
  dateCode: string;
  IDWithDateCode: string;
  buildingName: string;
  phone: string | null;
  phone2: string | null;
  residentialTargetedArea: string;
  totalRestrictedUnits: string;
  sedu: string;
  studioUnits: string;
  oneBedroomUnits: string;
  twoBedroomUnits: string;
  threePlusBedroomUnits: string;
  urlForBuilding: string;
  lat: string;
  lng: string;
  streetNum: string;
  street: string;
  city: string;
  state: string;
  zip: string;

  streetAddress: string;

  ami_30_micro?: string | null;
  ami_40_micro?: string | null;
  ami_50_micro?: string | null;
  ami_60_micro?: string | null;
  ami_65_micro?: string | null;
  ami_70_micro?: string | null;
  ami_75_micro?: string | null;
  ami_80_micro?: string | null;
  ami_85_micro?: string | null;
  ami_90_micro?: string | null;

  ami_30_studio?: string | null;
  ami_40_studio?: string | null;
  ami_50_studio?: string | null;
  ami_60_studio?: string | null;
  ami_65_studio?: string | null;
  ami_70_studio?: string | null;
  ami_75_studio?: string | null;
  ami_80_studio?: string | null;
  ami_85_studio?: string | null;
  ami_90_studio?: string | null;

  ami_30_oneBed?: string | null;
  ami_40_oneBed?: string | null;
  ami_50_oneBed?: string | null;
  ami_60_oneBed?: string | null;
  ami_65_oneBed?: string | null;
  ami_70_oneBed?: string | null;
  ami_75_oneBed?: string | null;
  ami_80_oneBed?: string | null;
  ami_85_oneBed?: string | null;
  ami_90_oneBed?: string | null;

  ami_30_twoBed?: string | null;
  ami_40_twoBed?: string | null;
  ami_50_twoBed?: string | null;
  ami_60_twoBed?: string | null;
  ami_65_twoBed?: string | null;
  ami_70_twoBed?: string | null;
  ami_75_twoBed?: string | null;
  ami_80_twoBed?: string | null;
  ami_85_twoBed?: string | null;
  ami_90_twoBed?: string | null;

  ami_30_threePlusBed?: string | null;
  ami_40_threePlusBed?: string | null;
  ami_50_threePlusBed?: string | null;
  ami_60_threePlusBed?: string | null;
  ami_65_threePlusBed?: string | null;
  ami_70_threePlusBed?: string | null;
  ami_75_threePlusBed?: string | null;
  ami_80_threePlusBed?: string | null;
  ami_85_threePlusBed?: string | null;
  ami_90_threePlusBed?: string | null;
};
