export class Config {
  serverEndpoint = "http://overlay.trayb.az";
  redirectUrl = "https://trayb.az";
  sponsorImageUrls: string[] = [];
  sponsorImageRotateSpeed = 5000; // in milliseconds

  mapbanEndpoint = "https://mapban-socket.valospectra.com";
  // mapbanEndpoint = "http://localhost:11201";

  attackerColorPrimary = "#b82e3c";
  attackerColorSecondary = "#ff4557";
  attackerColorShieldCurrency = "#ff838f";

  defenderColorPrimary = "#25ac79";
  defenderColorSecondary = "#61eab6";
  defenderColorShieldCurrency = "#61eab6";

  public constructor(init?: Partial<Config>) {
    Object.assign(this, init);
  }
}
