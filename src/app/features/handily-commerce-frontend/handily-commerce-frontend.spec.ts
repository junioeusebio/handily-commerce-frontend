import { TestBed } from "@angular/core/testing";
import { HandilyCommerceFrontend } from "./handily-commerce-frontend";

describe("HandilyCommerceFrontend", () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HandilyCommerceFrontend],
    }).compileComponents();
  });

  it("should create", () => {
    const fixture = TestBed.createComponent(HandilyCommerceFrontend);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it("should render the title", async () => {
    const fixture = TestBed.createComponent(HandilyCommerceFrontend);
    fixture.detectChanges();
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector("h1")?.textContent).toContain("Handily Commerce Frontend");
    expect(compiled.querySelector("p")?.textContent).toContain("Angular Handily Commerce Frontend");
  });
});
