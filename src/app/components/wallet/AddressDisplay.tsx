// components/AddressDisplay.tsx

import { truncateAddress } from "../../utils/helpers";

const AddressDisplay = ({ address }: { address: string }) => {
  return <span className="wallet-address">{truncateAddress(address)}</span>;
};

export default AddressDisplay;
