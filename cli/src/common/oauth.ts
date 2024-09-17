/* eslint-disable camelcase */
import axios, { AxiosInstance } from "axios";
import axios, { HttpsProxyAgent } from "https-proxy-agent"; //se importa libreria para configurar proxy
import Logger from "./logger";
class DTOAuth {
  SSOUrl: string;

  ClientId: string;

  ClientSecret: string;

  AccountUUID: string;

  axiosApiInstance: AxiosInstance;

  httpsProxyAgent: HttpsProxyAgent; // se crea atributo de clase para el proxy http

  constructor(
    ssoUrl: string,
    clientId: string,
    clientSecret: string,
    accountUUID: string,
    httpProxyURL:string, // se agrega parametro en el constructor para configuracion de proxy
  ) {
    this.SSOUrl = ssoUrl;
    this.ClientId = clientId;
    this.ClientSecret = clientSecret;
    this.AccountUUID = accountUUID;
    this.httpsProxyAgent = new HttpsProxyAgent(httpProxyURL)// se instancia el objeto httpsProxyAgent con la url del proxy a configurar
    // se instancia el objeto axiosApiInstance y se le pasa como parametro el objeto httpsProxyAgent y se setea el atributo proxy en false para 
    //desactivar el proxy por defecto de axios
    this.axiosApiInstance = axios.create({ 
      this.httpsProxyAgent,
      proxy: false
    });
  }

  async GetScopedToken(scope: string): Promise<string> {
    const data = {
      grant_type: "client_credentials",
      client_id: this.ClientId,
      client_secret: this.ClientSecret,
      scope: scope,
      resource: this.AccountUUID
    };
    let res = null;

    try {
      res = await this.axiosApiInstance.post(this.SSOUrl, data, {
        headers: { "content-type": "application/x-www-form-urlencoded" }
      });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      if (err?.response != 200) {
        Logger.verbose(err.message);

        if (err.response?.status == 400) {
          Logger.error(
            "Please check that the token has the correct permissions for the scope " +
              scope
          );
        }
      }

      throw new Error("Failed to get scoped token");
    }

    return res?.data.access_token;
  }
}
export default DTOAuth;
