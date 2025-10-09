import { Config } from "../../../shared/config";
import { Component, Input, AfterViewInit, OnChanges, DoCheck, ViewChild, ElementRef, ChangeDetectorRef } from "@angular/core";
import { NgIf, NgFor, NgClass } from "@angular/common";

@Component({
  selector: "app-ultimate",
  standalone: true,
  imports: [NgIf, NgFor, NgClass],
  templateUrl: "ultimate-tracker.component.html",
  styleUrl: "ultimate-tracker.component.css",
})
export class UltimateComponent implements AfterViewInit, OnChanges, DoCheck {
  public readonly assets: string = "../../../assets";

  private _player: any;
  private prevUltPoints: number = -1; // to track changes

  @Input()
  set player(val: any) {
    this._player = val;
    this.updateUltimateProgress();
    this.prevUltPoints = this._player?.currUltPoints;
  }
  get player() {
    return this._player;
  }

  @Input() color!: "attacker" | "defender";
  @Input() match!: any;
  @Input() side!: "left" | "right";
  @Input() hideAuxiliary = false;

  @ViewChild("svgContainer", { static: true }) svgContainerRef!: ElementRef<SVGSVGElement>;
  @ViewChild("ultimateVideo", { static: true }) videoRef!: ElementRef<HTMLVideoElement>;

  private wasUltReady = false;

  constructor(public config: Config, private cdRef: ChangeDetectorRef) {}

  ngAfterViewInit(): void {
    this.updateUltimateProgress();
    this.preloadVideo();
  }

  ngOnChanges(): void {
    this.updateUltimateProgress();
    this.handleUltimateStateChange();
  }

  ngDoCheck(): void {
    if (this.player && this.player.currUltPoints !== this.prevUltPoints) {
      this.prevUltPoints = this.player.currUltPoints;
      this.updateUltimateProgress();
      this.handleUltimateStateChange();
    }
  }

  public get dashes(): { collected: boolean; angle: number }[] {
    const dashSpan = (2 * Math.PI) / this.player.maxUltPoints;
    return Array.from({ length: this.player.maxUltPoints }, (_, i) => ({
        collected: i < this.player.currUltPoints,
        angle: i * dashSpan - Math.PI / 2 + dashSpan / 2,
    }));
  }

  public computePath(angle: number): string {
    const cx = 64, cy = 64, outerRadius = 18;
    const dashSpan = (2 * Math.PI) / this.player.maxUltPoints;
    const adjustedSpan = dashSpan * 0.8;
    const startAngle = angle - adjustedSpan / 2;
    const endAngle = angle + adjustedSpan / 2;
    const startX = cx + outerRadius * Math.cos(startAngle);
    const startY = cy + outerRadius * Math.sin(startAngle);
    const endX = cx + outerRadius * Math.cos(endAngle);
    const endY = cy + outerRadius * Math.sin(endAngle);
    return `M ${startX} ${startY} A ${outerRadius} ${outerRadius} 0 0 1 ${endX} ${endY}`;
  }

  private createDash(
    cx: number,
    cy: number,
    outerRadius: number,
    angle: number,
    originalSpan: number,
    collected: boolean
  ) {
    const dashCoverage = 0.8;
    const adjustedSpan = originalSpan * dashCoverage;
    const startAngle = angle - adjustedSpan / 2;
    const endAngle = angle + adjustedSpan / 2;
    const startX = cx + outerRadius * Math.cos(startAngle);
    const startY = cy + outerRadius * Math.sin(startAngle);
    const endX = cx + outerRadius * Math.cos(endAngle);
    const endY = cy + outerRadius * Math.sin(endAngle);
    const largeArcFlag = 0;
    const sweepFlag = 1;

    const pathData = `
      M ${startX} ${startY}
      A ${outerRadius} ${outerRadius} 0 ${largeArcFlag} ${sweepFlag} ${endX} ${endY}
    `.trim();

    const dash = document.createElementNS("http://www.w3.org/2000/svg", "path");
    dash.setAttribute("d", pathData);

    // Use white for all collected dashes
    dash.setAttribute(
      "stroke",
      collected
        ? "#fff"
        : "rgba(163, 163, 163, 0.5)"
    );
    dash.setAttribute("stroke-width", "3");
    dash.setAttribute("fill", "none");
    dash.setAttribute("stroke-linecap", "butt");

    this.svgContainerRef.nativeElement.appendChild(dash);
  }

  private updateUltimateProgress(): void {
    if (!this.svgContainerRef) {
      return;
    }
    const svgContainer = this.svgContainerRef.nativeElement;
    svgContainer.innerHTML = "";
    const cx = 64, cy = 64, outerRadius = 18;

    if (this.player.ultReady === true) {
      const defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");
      const filter = document.createElementNS("http://www.w3.org/2000/svg", "filter");
      filter.setAttribute("id", "glow");
      filter.setAttribute("x", "-100%");
      filter.setAttribute("y", "-100%");
      filter.setAttribute("width", "300%");
      filter.setAttribute("height", "300%");

      const feDropShadow = document.createElementNS("http://www.w3.org/2000/svg", "feDropShadow");
      feDropShadow.setAttribute("dx", "0");
      feDropShadow.setAttribute("dy", "0");
      feDropShadow.setAttribute("stdDeviation", "9");
      feDropShadow.setAttribute("flood-color", "white");
      feDropShadow.setAttribute("flood-opacity", "1");

      const animate = document.createElementNS("http://www.w3.org/2000/svg", "animate");
      animate.setAttribute("attributeName", "stdDeviation");
      animate.setAttribute("values", "9;24;24;9");
      animate.setAttribute("keyTimes", "0;0.4;0.5;1");
      animate.setAttribute("calcMode", "spline");
      animate.setAttribute("keySplines", "0.42 0 0.58 1; 0 0 1 1; 0.42 0 0.58 1");
      animate.setAttribute("dur", "5s");
      animate.setAttribute("repeatCount", "indefinite");

      feDropShadow.appendChild(animate);
      filter.appendChild(feDropShadow);
      defs.appendChild(filter);
      svgContainer.appendChild(defs);

      const glowingCircle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
      glowingCircle.setAttribute("cx", cx.toString());
      glowingCircle.setAttribute("cy", cy.toString());
      glowingCircle.setAttribute("r", outerRadius.toString());
      glowingCircle.setAttribute("stroke", "white");
      glowingCircle.setAttribute("stroke-width", "3");
      glowingCircle.setAttribute("fill", "none");
      glowingCircle.setAttribute("filter", "url(#glow)");

      svgContainer.appendChild(glowingCircle);
    } else {
      const dashSpan = (2 * Math.PI) / this.player.maxUltPoints;
      const isAttacking = this.match?.teams?.[this.player.teamIndex]?.isAttacking ?? false;
      for (let i = 0; i < this.player.maxUltPoints; i++) {
        const angle = i * dashSpan - Math.PI / 2 + dashSpan / 2;
        this.createDash(
          cx,
          cy,
          outerRadius,
          angle,
          dashSpan,
          i < this.player.currUltPoints,
        );
      }
    }

    this.cdRef.detectChanges();
  }

  private preloadVideo(): void {
    if (this.videoRef?.nativeElement) {
      const video = this.videoRef.nativeElement;
      // Preload the video to eliminate delay
      video.load();
      
      // Set up event listeners for better control
      video.addEventListener('loadeddata', () => {
        console.log('Ultimate video preloaded successfully');
        // If ultimate is ready when video loads, start playing
        if (this.player?.ultReady) {
          this.playVideo();
        }
      });
      
      video.addEventListener('error', (e) => {
        console.warn('Ultimate video preload failed:', e);
      });

      // Prevent video from pausing due to browser optimizations
      video.addEventListener('pause', (e) => {
        if (this.player?.ultReady && !video.ended) {
          // If the video was paused but ultimate is still ready, restart it
          setTimeout(() => {
            if (this.player?.ultReady) {
              this.playVideo();
            }
          }, 50);
        }
      });
    }
  }

  private playVideo(): void {
    if (!this.videoRef?.nativeElement) return;
    
    const video = this.videoRef.nativeElement;
    if (video.readyState >= 2) { // Video has loaded enough to play
      video.currentTime = 0;
      video.play().catch(e => console.warn('Video play failed:', e));
    } else {
      // Wait for video to be ready
      video.addEventListener('canplay', () => {
        if (this.player?.ultReady) {
          video.currentTime = 0;
          video.play().catch(e => console.warn('Video play failed:', e));
        }
      }, { once: true });
    }
  }

  private handleUltimateStateChange(): void {
    if (!this.videoRef?.nativeElement) return;
    
    const video = this.videoRef.nativeElement;
    const isUltReady = this.player?.ultReady;
    
    if (isUltReady && !this.wasUltReady) {
      // Ultimate just became ready - start playing
      this.playVideo();
    } else if (!isUltReady && this.wasUltReady) {
      // Ultimate no longer ready - pause and reset video
      video.pause();
      video.currentTime = 0;
    }
    
    this.wasUltReady = isUltReady;
  }
}
