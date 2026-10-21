"""Create a developer-loadable ZIP; release CCX signing uses Adobe's UXP tools."""
from pathlib import Path
from zipfile import ZipFile, ZIP_DEFLATED
root = Path(__file__).resolve().parent.parent
output = root / 'dist' / 'local-upscale.zip'
output.parent.mkdir(exist_ok=True)
with ZipFile(output, 'w', ZIP_DEFLATED) as archive:
    for source in sorted((root / 'plugin').iterdir()):
        if source.is_file():
            archive.write(source, source.name)
print(output)
