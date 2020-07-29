document.addEventListener("DOMContentLoaded", function() {
  const ipcRenderer = require("electron").ipcRenderer;
  let solvedNum = 0;
  let request = 0;
  let runnable = true;

  const element = document.createElement("div");
  document.body.innerText = "";
  element.innerHTML=`
    <style>
      body {
        height: 100vh;
        background-color: rgb(33,33,33);
        padding: 0;
        font-family: sans-serif;
      }
      .lds-default {
        display: inline-block;
        position: relative;
        width: 160px;
        height: 160px;
      }
      .lds-default div {
        position: absolute;
        width: 12px;
        height: 12px;
        background-color: #F9BD28;
        border-radius: 50%;
        animation: lds-default 1.2s linear infinite;
      }
      .lds-default div:nth-child(1) {
        animation-delay: 0s;
        top: 74px;
        left: 132px;
      }
      .lds-default div:nth-child(2) {
        animation-delay: -0.1s;
        top: 44px;
        left: 124px;
      }
      .lds-default div:nth-child(3) {
        animation-delay: -0.2s;
        top: 22px;
        left: 104px;
      }
      .lds-default div:nth-child(4) {
        animation-delay: -0.3s;
        top: 14px;
        left: 74px;
      }
      .lds-default div:nth-child(5) {
        animation-delay: -0.4s;
        top: 22px;
        left: 44px;
      }
      .lds-default div:nth-child(6) {
        animation-delay: -0.5s;
        top: 44px;
        left: 22px;
      }
      .lds-default div:nth-child(7) {
        animation-delay: -0.6s;
        top: 74px;
        left: 14px;
      }
      .lds-default div:nth-child(8) {
        animation-delay: -0.7s;
        top: 104px;
        left: 22px;
      }
      .lds-default div:nth-child(9) {
        animation-delay: -0.8s;
        top: 124px;
        left: 44px;
      }
      .lds-default div:nth-child(10) {
        animation-delay: -0.9s;
        top: 132px;
        left: 74px;
      }
      .lds-default div:nth-child(11) {
        animation-delay: -1s;
        top: 124px;
        left: 104px;
      }
      .lds-default div:nth-child(12) {
        animation-delay: -1.1s;
        top: 104px;
        left: 124px;
      }
      @keyframes lds-default {
        0%, 20%, 80%, 100% {
          transform: scale(1);
        }
        50% {
          transform: scale(1.5);
        }
      }
    </style>
    <div style="font-size: 20px;font-weight: bolder; overflow: hidden">
      <div style="display: flex; flex-direction: column; margin: 10px;">
        <div style="color:#F9BD28;margin:10px;" id="captchaMessage">Waiting for Captcha Request... </div>
        <div id="loading-indicator" style="display:table-cell;text-align:center;vertical-align:middle;">
            <div class="lds-default" style="display:inline-block;"><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div></div>
        </div>
      </div>
      <div style="position:absolute;bottom:20px;">
        <button class="g-recaptcha" data-sitekey="6LeWwRkUAAAAAOBsau7KpuC9AV-6J8mhw4AjC3Xz" data-callback='sub'
        style="margin-left:20px;opacity:0.8;color:white;height:40px;width:200px;border-radius:15px;background:transparent;border: 2px solid #219E6C">Solve Captcha</button>
        <script type="text/javascript" src="https://www.google.com/recaptcha/api.js"></script>
      </div>
    </div>
  `;
  document.body.appendChild(element);

  ipcRenderer.on("requestCaptcha", () => {
    request++;
    document.querySelector("#captchaMessage").innerText = "Please Solve Captcha!";
    document.querySelector("#captchaMessage").style.color = "red";
    document.querySelector("#loading-indicator").style.visibility = 'hidden';
    if (runnable) {
      runnable = false;
      grecaptcha.execute();
    }
  });

  window.sub = () => {
    document.querySelector("#captchaMessage").innerText = "Got Captcha! Count: " + (solvedNum + 1);
    document.querySelector("#captchaMessage").style.color = "greenyellow";
    document.querySelector("#loading-indicator").style.visibility = 'visible';

    request--;
    solvedNum++;
    if (request >= 0) {
      ipcRenderer.send(
        "sendCaptcha",
        document.querySelector("#g-recaptcha-response").value
      );
      console.log(document.querySelector("#g-recaptcha-response").value);
    } else {
      request = 0;
    }
    grecaptcha.reset();
    if (request > 0) {
      grecaptcha.execute();
    } else {
      runnable = true;
    }
  };

});
