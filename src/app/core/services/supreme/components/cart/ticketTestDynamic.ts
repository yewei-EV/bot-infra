import {Util} from '../../../../../shared';
import {Page} from 'puppeteer';

export async function generateTicket(page: Page, ticket): Promise<string> {
  await page.goto('https://www.supremenewyork.com/mobile/');
  while (true) {
    if (await getCookie("_tlcket", page) != null && await getCookie("tlcket", page) == null) {
      if (!ticket) {
        return;
      }
      await page.setCookie({ name: "tlcket", value: ticket});
      console.log("Initial ticket: ", ticket)
    } else if (await getCookie("_tlcket", page) != null && await getCookie("tlcket", page) != null) {
      let _ticketCurrent = await getCookieValue("_tlcket", page)
      if (!_ticketCurrent.includes(ticket)) {
        console.log("_ticket not genned yet... keep waiting...", await getCookieValue("_tlcket", page));
      } else {
        _ticketCurrent = await getCookieValue("_tlcket", page);
        return _ticketCurrent
        }
      }
      await Util.delay(10);
    }
}

export async function waitingTicket(page: Page): Promise<string> {
  const regex = new RegExp('^[a-zA-Z0-9]{120,300}[0-9]{10}$');
  while (true) {
    const cookies = await page.cookies();
    let ticketCookie = cookies.filter(cookie => regex.exec(cookie.value) !== null)
    if (ticketCookie.length === 2) {
      if (ticketCookie[0].value.substring(0,3) === ticketCookie[1].value.substring(0,3)) {
        return;
      } else {
        console.log("_ticket not genned yet... keep waiting...");
      }
    } else {
      console.log("ticket and _ticket not found!");
    }
    await Util.delay(10);
  }

  // while (true) {
  //   let ticket = await getCookieValue("tlcket", page);
  //   let _ticket = await getCookieValue("_tlcket", page);
  //   if (ticket !== "" && _ticket !== "") {
  //     let _ticketCurrent = await getCookieValue("_tlcket", page)
  //     if (!_ticketCurrent.includes(ticket)) {
  //       console.log("_ticket not genned yet... keep waiting...", await getCookieValue("_tlcket", page));
  //     } else {
  //       return _ticketCurrent
  //     }
  //   }
  //   await Util.delay(10);
  // }
}

export async function getPureCart(page: Page): Promise<string> {
  return await getCookieValue("pure_cart", page);
}

async function getCookie(name, page: Page): Promise<object> {
  const cookie = await page.cookies();
  let targetCookie = cookie.filter(x=>{return x.name == name})
  return targetCookie[0];
}

async function getCookieValue(a, page: Page): Promise<string> {
  const cookie = await page.cookies();
  let targetCookie = cookie.filter(x=>{return x.name == a});
  return targetCookie.length > 0 ? targetCookie[0].value : "";
}


