import { ApolloServer } from '@apollo/server';
import { startStandaloneServer } from '@apollo/server/standalone';

const typeDefs = `#graphql
type WeaponStats {
  statName: String
  value: Int
}

type WeaponSocket {
  itemTypeDisplayName: String
  perks: [Perk]
}

type Perk {
  name: String
  icon: String
  itemTypeDisplayName: String
}

type DisplayProperties {
  name: String
  icon: String
  description: String
  hasIcon: Boolean
}

type Weapon {
  displayProperties: DisplayProperties
  iconWatermark: String
  flavorText: String
  ammoTypeName: String
  damageTypeIcon: String
  itemSubType: String
  equipmentSlotName: String
  stats: [WeaponStats]
  breakerTypeIcon: String
  sockets: [WeaponSocket]
}

type WeaponPage {
  weapons: [Weapon]
  totalPages: Int
  currentPage: Int
}

type Query {
  weapons(search: String, page: Int, resultsPerPage: Int): WeaponPage
}
`;
export default typeDefs;