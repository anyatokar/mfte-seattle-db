import { Timestamp } from "firebase/firestore";
import { BedroomsKeyEnum } from "./enums";

export type PercentAmi =
  | "30"
  | "40"
  | "50"
  | "60"
  | "65"
  | "70"
  | "75"
  | "80"
  | "85"
  | "90";

export type AmiData = { [key in BedroomsKeyEnum]: PercentAmi[] };

export type Address = {
  city: string;
  state: string;
  zip: string;
  neighborhood: string;
  streetAddress: string;
  lat: number;
  lng: number;
};

export type Contact = {
  phone: string | null;
  phone2: string | null;
  urlForBuilding: string;
};

type SearchFields = {
  buildingName: string;
  neighborhood: string;
  streetAddress: string;
  zip: string;
};

export default interface IBuilding {
  buildingID: string;
  dateCode: string;
  buildingName: string;
  updatedTimestamp: Timestamp;
  amiData: AmiData;
  address: Address;
  contact: Contact;
  searchFields: SearchFields;
  isEnding: boolean;
  isAgeRestricted: boolean;
}
