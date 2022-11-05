import FUNCTIONS from "firebase-functions";
import "dotenv/config";
import CHALK from "chalk";
import CLIENT from "kraken-api";

const client = new CLIENT(
  process.env.KRAKEN_API_KEY,
  process.env.KRAKEN_API_SECRET
);

const trade = async (pair, volume, price, close) => {
  const order = {
    pair,
    type: "buy",
    ordertype: "limit",
    oflags: "post",
    volume: String(volume),
    price: String(price),
  };
  if (close) {
    order["close[ordertype]"] = "limit";
    order["close[price]"] = String(close);
  }
  const request = await client.api("AddOrder", order);
  console.log(request["result"]["descr"]["order"].toUpperCase());
};

export const trader = FUNCTIONS.pubsub
  .schedule("every 5 minutes")
  .onRun(async () => {
    const balance = await client.api("Balance");
    const dollars = parseInt(balance["result"]["ZUSD"].split(".")[0]);
    const orders = await client.api("OpenOrders");
    if (Object.keys(orders["result"]["open"]).length < 1) {
      const pair = "ALGOUSD";
      const ticker = await client.api("Ticker", { pair });
      const bid = ticker["result"][pair]["b"][0];
      const price = (parseFloat(bid) * 0.9999).toFixed(3);
      const volume = (dollars / price).toFixed(6);
      const close = (price * 1.01).toFixed(5);
      trade(pair, volume, price, close);
    }
  });

// export const accumulator = FUNCTIONS.pubsub
//   .schedule("every day 06:00")
//   .timeZone("UTC")
//   .onRun(async () => {
//     const pair = "XXBTZUSD";
//     const ticker = await client.api("Ticker", { pair });
//     const bid = ticker["result"][pair]["b"][0];
//     const value = 10;
//     const price = (parseFloat(bid) * 0.9999).toFixed(1);
//     const volume = (value / price).toFixed(9);
//     trade(pair, volume, price);
//   });

// const check = async () => {
//   const balance = await client.api("Balance");
//   console.log(CHALK.bold.green("BALANCE"), balance["result"]);
//   const orders = await client.api("OpenOrders");
//   console.log(CHALK.bold.green("ORDERS"), orders["result"]["open"]);
// };

// check();
