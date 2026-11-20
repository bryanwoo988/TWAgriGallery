/* Fixed addresses. */

// Where the app is published; the share sheet's QR code points here.
export const APP_URL = 'https://bryanwoo988.github.io/TWAgriGallery/';

// The source: MOA Agricultural Knowledge Portal, theme halls.
export const MOA = 'https://kmweb.moa.gov.tw';
export const MOA_LIST = `${MOA}/theme_list.php?theme=subject_list_view`;
export const hallUrl = id => `${MOA}/subject/index.php?id=${id}`;
export const sectionUrl = id => `${MOA}/subject/subject.php?id=${id}`;

// Every key this app writes to localStorage or Cache Storage starts with this.
export const PREFIX = 'twagri';
