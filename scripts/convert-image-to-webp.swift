import AppKit
import Foundation
import ImageIO
import UniformTypeIdentifiers

let webPTypeIdentifier = "org.webmproject.webp"

struct Arguments {
  let inputPath: String
  let outputPath: String
  let maxPixelSize: CGFloat?
}

func parseArguments() -> Arguments? {
  let args = CommandLine.arguments.dropFirst()
  guard args.count >= 2 else { return nil }

  let inputPath = String(args[args.startIndex])
  let outputPath = String(args[args.index(after: args.startIndex)])

  var maxPixelSize: CGFloat?
  var index = args.index(args.startIndex, offsetBy: 2)

  while index < args.endIndex {
    let value = args[index]
    if value == "--max-pixel-size" {
      let next = args.index(after: index)
      guard next < args.endIndex, let parsed = Double(args[next]) else { return nil }
      maxPixelSize = CGFloat(parsed)
      index = args.index(after: next)
      continue
    }
    index = args.index(after: index)
  }

  return Arguments(inputPath: inputPath, outputPath: outputPath, maxPixelSize: maxPixelSize)
}

func resizedImage(_ image: NSImage, maxPixelSize: CGFloat?) -> NSImage? {
  guard let maxPixelSize, maxPixelSize > 0 else { return image }

  let originalSize = image.size
  let longestSide = max(originalSize.width, originalSize.height)

  guard longestSide > maxPixelSize else { return image }

  let scale = maxPixelSize / longestSide
  let newSize = NSSize(width: floor(originalSize.width * scale), height: floor(originalSize.height * scale))
  let output = NSImage(size: newSize)

  output.lockFocus()
  image.draw(in: NSRect(origin: .zero, size: newSize))
  output.unlockFocus()

  return output
}

func writeWebP(image: NSImage, outputPath: String) throws {
  guard
    let tiff = image.tiffRepresentation,
    let bitmap = NSBitmapImageRep(data: tiff),
    let cgImage = bitmap.cgImage
  else {
    throw NSError(domain: "FamilyFlowImage", code: 1, userInfo: [NSLocalizedDescriptionKey: "Could not decode source image"])
  }

  let outputURL = URL(fileURLWithPath: outputPath)
  let destination = CGImageDestinationCreateWithURL(outputURL as CFURL, webPTypeIdentifier as CFString, 1, nil)
  guard let destination else {
    throw NSError(domain: "FamilyFlowImage", code: 2, userInfo: [NSLocalizedDescriptionKey: "Could not create WebP destination"])
  }

  let properties: CFDictionary = [
    kCGImageDestinationLossyCompressionQuality: 0.9,
  ] as CFDictionary

  CGImageDestinationAddImage(destination, cgImage, properties)

  if !CGImageDestinationFinalize(destination) {
    throw NSError(domain: "FamilyFlowImage", code: 3, userInfo: [NSLocalizedDescriptionKey: "Could not finalize WebP output"])
  }
}

guard let arguments = parseArguments() else {
  fputs("Usage: swift scripts/convert-image-to-webp.swift <input> <output> [--max-pixel-size <n>]\n", stderr)
  exit(1)
}

let inputURL = URL(fileURLWithPath: arguments.inputPath)

guard let sourceImage = NSImage(contentsOf: inputURL) else {
  fputs("Could not open input image: \(arguments.inputPath)\n", stderr)
  exit(1)
}

guard let preparedImage = resizedImage(sourceImage, maxPixelSize: arguments.maxPixelSize) else {
  fputs("Could not resize image\n", stderr)
  exit(1)
}

do {
  try writeWebP(image: preparedImage, outputPath: arguments.outputPath)
} catch {
  fputs("WebP conversion failed: \(error.localizedDescription)\n", stderr)
  exit(1)
}
