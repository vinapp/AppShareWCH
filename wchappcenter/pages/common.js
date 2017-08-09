// Base URL for APIs - replace {Host} and {Tenant ID} using the values available
// from the "i" information icon at the top left of the WCH screen
const baseTenantAPIUrl = "";
const wchLoginURL = baseTenantAPIUrl + "/login/v1/basicauth";
const serverBaseUrl = "https://my11.digitalexperience.ibm.com";
const tenantid = "";

// Content Hub blueid username and password - replace these or add code to get these from inputs
const username = "";
const password = "";

const contentService = "authoring/v1/content";
const resourceService = "authoring/v1/resources";
const assetService = "authoring/v1/assets";
const searchService = "authoring/v1/search";
