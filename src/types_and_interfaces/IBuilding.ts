import { Timestamp } from "firebase/firestore";

export type amiPercentageType = 30 | 40 | 50 | 60 | 65 | 70 | 75 | 80 | 85 | 90;
export type numBedroomsType = "micro" | "studio" | "oneBed" | "twoBed" | "threePlusBed";

export type amiDataType = {
  micro: amiPercentageType[];
  studio: amiPercentageType[];
  oneBed: amiPercentageType[];
  twoBed: amiPercentageType[];
  threePlusBed: amiPercentageType[];
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
  lat: number;
  lng: number;
  streetNum: string;
  street: string;
  city: string;
  state: string;
  zip: string;
  updatedTimestamp: Timestamp;

  streetAddress: string;
  amiData: amiDataType;
}
