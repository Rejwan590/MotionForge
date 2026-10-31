import asyncio
import edge_tts
import sys

async def main():
    text = "Hello world from MotionForge audio engine."
    voice = "en-US-JennyNeural"
    c = edge_tts.Communicate(text, voice)
    await c.save("test_audio.mp3")
    print("Saved test_audio.mp3 successfully")

asyncio.run(main())
