const fs = require('fs');
const p = 'client/src/App.tsx';
let s = fs.readFileSync(p, 'utf8');
const oldLine = 'import Pricing from "@/pages/Pricing";';
const newLine = 'import Pricing from "@/pages/PricingNew";';
if (s.includes(oldLine)) {
  s = s.replace(oldLine, newLine);
  fs.writeFileSync(p, s, 'utf8');
  console.log('updated');
} else {
  console.log('pattern not found');
}
