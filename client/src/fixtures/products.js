import side1 from "../assets/side1.png";
import side2 from "../assets/side2.png";
import side3 from "../assets/side3.png";

// Same shape as the Product struct returned by getProducts() on the contract
export const products = [
  {
    id: "1",
    owner: "0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063",
    name: "Noise Cancelling Headphones",
    prodimg: side1,
    orderIDs: [],
    amt: "50000000000000000",
    min_review_count: "5",
    prod_Details: "Over-ear wireless headphones with 30 hours of battery life.",
    company_name: "SoundWave",
    typ: true,
    status: "ongoing",
    nextAmount: "10000000000000000",
    reviewCount: "2",
  },
  {
    id: "2",
    owner: "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174",
    name: "Smart Fitness Band",
    prodimg: side2,
    orderIDs: [],
    amt: "30000000000000000",
    min_review_count: "3",
    prod_Details: "Tracks steps, heart rate and sleep. Water resistant up to 50m.",
    company_name: "FitTrack",
    typ: false,
    status: "ongoing",
    nextAmount: "5000000000000000",
    reviewCount: "1",
  },
  {
    id: "3",
    owner: "0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619",
    name: "Ceramic Coffee Mug",
    prodimg: side3,
    orderIDs: [],
    amt: "10000000000000000",
    min_review_count: "10",
    prod_Details: "Handmade 350ml mug, microwave and dishwasher safe.",
    company_name: "Clay Studio",
    typ: false,
    status: "ongoing",
    nextAmount: "1000000000000000",
    reviewCount: "7",
  },
];
