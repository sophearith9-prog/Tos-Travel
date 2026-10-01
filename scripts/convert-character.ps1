Add-Type -AssemblyName System.Drawing
Add-Type -ReferencedAssemblies System.Drawing -TypeDefinition @"
using System;
using System.Drawing;
using System.Drawing.Imaging;
using System.Drawing.Drawing2D;
using System.Collections.Generic;
public static class CharacterSheet {
 public static int[] Convert(string input, string output) {
  using(var gif = Image.FromFile(input)) {
   var dim = new FrameDimension(gif.FrameDimensionsList[0]);
   int count = gif.GetFrameCount(dim), left=gif.Width, top=gif.Height, right=0, bottom=0;
   var frames = new List<Bitmap>();
   var durations = new int[count];
   byte[] delays = gif.GetPropertyItem(0x5100).Value;
   for(int i=0;i<count;i++) {
    gif.SelectActiveFrame(dim,i);
    var frame = new Bitmap(gif.Width,gif.Height,PixelFormat.Format32bppArgb);
    using(var g=Graphics.FromImage(frame)) g.DrawImage(gif,0,0,gif.Width,gif.Height);
    var bg=frame.GetPixel(0,0);
    frame.MakeTransparent(bg);
    for(int y=0;y<frame.Height;y+=2) for(int x=0;x<frame.Width;x+=2) {
     var c=frame.GetPixel(x,y);
     if(c.A>0 && Math.Abs(c.R-bg.R)+Math.Abs(c.G-bg.G)+Math.Abs(c.B-bg.B)>40) {
      left=Math.Min(left,x);top=Math.Min(top,y);right=Math.Max(right,x);bottom=Math.Max(bottom,y);
     }
    }
    frames.Add(frame);
    durations[i]=Math.Max(20,BitConverter.ToInt32(delays,i*4)*10);
   }
   left=Math.Max(0,left-4);top=Math.Max(0,top-4);right=Math.Min(gif.Width,right+5);bottom=Math.Min(gif.Height,bottom+5);
   float scale=Math.Min(92f/(right-left),92f/(bottom-top));
   float w=(right-left)*scale,h=(bottom-top)*scale;
   using(var sheet=new Bitmap(96*6,96*((count+5)/6),PixelFormat.Format32bppArgb)) {
    using(var g=Graphics.FromImage(sheet)) {
     g.InterpolationMode=InterpolationMode.HighQualityBicubic;
     for(int i=0;i<count;i++) {
      g.DrawImage(frames[i],new RectangleF((i%6)*96+(96-w)/2,(i/6)*96+96-h,w,h),new RectangleF(left,top,right-left,bottom-top),GraphicsUnit.Pixel);
      frames[i].Dispose();
     }
    }
    sheet.Save(output,ImageFormat.Png);
   }
   return durations;
  }
 }
}
"@
$project = Split-Path $PSScriptRoot -Parent
$durations = [CharacterSheet]::Convert((Join-Path $project 'assets/charecter.gif'), (Join-Path $project 'assets/character-sheet.png'))
@{ frameWidth=96; frameHeight=96; durations=@($durations) } | ConvertTo-Json | Set-Content -Encoding UTF8 (Join-Path $project 'assets/character-animation.json')
Write-Output "Converted $($durations.Count) frames."
