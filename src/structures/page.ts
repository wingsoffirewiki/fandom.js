export class Page {
  public pageid: number;
  public ns: number;
  public title: string;
  public extract?: string;

  constructor(data: {
    pageid: number;
    ns: number;
    title: string;
    extract?: string;
  }) {
    this.pageid = data.pageid;
    this.ns = data.ns;
    this.title = data.title;
    this.extract = data.extract;
  }
}
