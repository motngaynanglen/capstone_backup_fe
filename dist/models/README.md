# 3D Models Folder

Đặt các file 3D model vào folder này để sử dụng trong Design3DCustomizer.

## Supported Formats

- `.glb` (recommended - binary, smaller file size)
- `.gltf` (text-based, can include external textures)

## Required Files

| Filename | Description |
|----------|-------------|
| `tshirt.glb` | Áo thun in 3D |
| `figure.glb` | Chibi Figure |
| `phonecase.glb` | Ốp điện thoại |
| `mug.glb` | Cốc in hình |
| `keychain.glb` | Móc khóa |

## How to Add Models

1. Export model từ Blender/3ds Max/Maya với format `.glb`
2. Copy file vào folder `public/models/`
3. Đảm bảo tên file trùng với `modelPath` trong `mockVariants`

## Blender Export Settings

1. File → Export → glTF 2.0 (.glb/.gltf)
2. Chọn format: **glTF Binary (.glb)**
3. Include: Mesh, Materials
4. Transform: +Y Up

## Free 3D Resources

- [Sketchfab](https://sketchfab.com/)
- [Poly Pizza](https://poly.pizza/)
- [Free3D](https://free3d.com/)
- [CGTrader Free](https://www.cgtrader.com/free-3d-models)
