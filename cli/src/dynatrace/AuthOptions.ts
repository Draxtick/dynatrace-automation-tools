import { Command, Option } from "commander";
import DTOAuth from "../common/oauth";
import Logger from "../common/logger";
import axios, { AxiosInstance } from "axios";
import { DTA_CLI_VERSION } from "./../version";
//Abstracts the authentication options for the CLI. Common class since all Dynatrace API interactions would use the same authentication options.
export type AuthOption = {
  "<account_urn>": string;
  "<dynatrace_url_gen3>": string;
  "<client_id>": string;
  "<client_secret>": string;
  "<sso_url>": string;
  "<https_proxy_url>": string; // se agrega variable de entorno para recibir la url del proxy http
};

class AuthOptions {
  options: AuthOption;

  constructor() {
    this.options = {
      "<account_urn>": "",
      "<dynatrace_url_gen3>": "",
      "<client_id>": "",
      "<client_secret>": "",
      "<sso_url>": "",
      "<https_proxy_url>": "" // se agrega linea para inicializar en blanco la variable del proxy http

    };
  }

  addOathOptions(mainCommand: Command): Command {
    mainCommand
      .addOption(
        new Option(
          "<account_urn>",
          "Account URN i.e. urn:dtaccount:xxxx-xxxx-xxxx-xxx"
        )
          .env("ACCOUNT_URN")
          .makeOptionMandatory()
      )
      .addOption(
        new Option("<dynatrace_url_gen3>", "dynatrace environment URL")
          .env("DYNATRACE_URL_GEN3")
          .makeOptionMandatory()
      )
      .addOption(
        new Option("<client_id>", "Dynatrace Client ID i.e dt0s02.xxx")
          .env("DYNATRACE_CLIENT_ID")
          .makeOptionMandatory()
      )
      .addOption(
        new Option(
          "<client_secret>",
          "Dynatrace Oauth secret i.e. dt0s02.xxxxxxxx"
        )
          .env("DYNATRACE_SECRET")
          .makeOptionMandatory()
      )
      .addOption(
        new Option("<sso_url>", "Dynatrace SSO Oauth URL")
          .env("DYNATRACE_SSO_URL")
          .default("https://sso.dynatrace.com/sso/oauth2/token")
      )
      .addOption(
        new Option("<https_proxy_url>", "http proxy URL")
          .env("HTTP_PROXY_URL") 
          .default("") // se inicializa la opcion https_proxy_url y La variable de entorno del proxy debe llamarse HTTP_PROXY_URL
      );
    return mainCommand;
  }

  setOptionsValuesForAuth(options: AuthOption) {
    this.options = options;
  }

  getGen3ClientWithScopeRequest = async (scope: string) => {
    const oauth = new DTOAuth(
      this.options["<sso_url>"],
      this.options["<client_id>"],
      this.options["<client_secret>"],
      this.options["<account_urn>"],
      this.options["<https_proxy_url>"] // se agrega parametro para el proxy URL para el constructor de la clase DTOAuth
    );

    Logger.verbose("DTApiV3: Requesting scoped token for " + scope);
    const token = await oauth.GetScopedToken(scope);
    const axiosApiInstance: AxiosInstance = axios.create();
    axiosApiInstance.defaults.headers.common["Authorization"] =
      "Bearer " + token;
    axiosApiInstance.defaults.headers.common["Content-Type"] =
      "application/json";
    axiosApiInstance.defaults.baseURL = this.options["<dynatrace_url_gen3>"];
    axiosApiInstance.defaults.headers.common["User-Agent"] =
      this.getUserAgent();
    return axiosApiInstance;
  };
  getUserAgent = (): string => {
    return (
      "Dynatrace Automation CLI/" +
      DTA_CLI_VERSION +
      " " +
      (process.version + " " + process.arch)
    );
  };
}

export default AuthOptions;
