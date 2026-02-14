<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="show" class="modal-overlay" @click.self="$emit('close')">
        <div class="modal-content tron-panel animate-fade-in">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-tron-cyan text-sm font-bold tracking-wider uppercase">How to Use QuadCalc</h3>
            <button class="tron-btn text-xs px-2 py-1" @click="$emit('close')">CLOSE</button>
          </div>

          <div class="help-content">
            <section>
              <h4>What is this?</h4>
              <p>
                QuadCalc helps you plan an FPV drone build. FPV stands for "First Person View" — you
                fly a small racing/freestyle drone while wearing goggles that show a live video feed
                from the drone's camera. It's like a video game, but real.
              </p>
              <p>
                Building your own drone means picking about 13 different parts that all need to work
                together. That's where QuadCalc comes in — it checks if your parts are compatible and
                warns you before you buy something that won't fit.
              </p>
            </section>

            <section>
              <h4>The Diagram</h4>
              <p>
                The center of the screen shows a top-down view of a quadcopter with 13 component
                slots arranged around it. Each circle represents a part of your build.
              </p>
              <ul>
                <li><span class="text-tron-cyan">Cyan/blue circles</span> = empty slot, nothing selected yet</li>
                <li><span class="text-tron-green">Green circles</span> = part selected and compatible with your other parts</li>
                <li><span class="text-tron-red">Red circles</span> = part has a compatibility problem with another part</li>
                <li><span class="text-tron-yellow">Yellow circles</span> = minor warning (will work, but not ideal)</li>
              </ul>
            </section>

            <section>
              <h4>Picking Parts</h4>
              <ol>
                <li><strong>Click any circle</strong> on the diagram to open that component's panel on the right</li>
                <li><strong>Browse the preset list</strong> or use the search box to find a specific part</li>
                <li><strong>Click a part</strong> to select it — it immediately goes into your build</li>
                <li><strong>Check the alerts</strong> at the bottom-left for any compatibility issues</li>
              </ol>
              <p>
                You can also use <strong>"Import from URL"</strong> to paste a product link from any
                FPV store — the AI will scan the page and extract the component details automatically.
              </p>
            </section>

            <section>
              <h4>What Needs to Match?</h4>
              <p>Here are the most important things QuadCalc checks for you:</p>
              <ul>
                <li>
                  <strong>Frame size = Prop size:</strong> A 5-inch frame needs 5-inch propellers.
                  You can't mix sizes.
                </li>
                <li>
                  <strong>Video system must match:</strong> Your camera, VTX (video transmitter),
                  and goggles must ALL use the same system — either Analog, DJI, HDZero, or Walksnail.
                  They are not cross-compatible.
                </li>
                <li>
                  <strong>Radio protocol must match:</strong> Your handheld transmitter (TX) and the
                  receiver (RX) on the drone must speak the same language — ELRS, Crossfire, FrSky,
                  or FlySky.
                </li>
                <li>
                  <strong>Battery voltage:</strong> Your battery's cell count (like "6S") must be
                  within what the ESC and flight controller can handle. Too much voltage = fried electronics.
                </li>
                <li>
                  <strong>Mounting patterns:</strong> The flight controller and ESC mount to the frame
                  via standard hole patterns. 5" quads use 30.5x30.5mm, 3" quads use 25.5x25.5mm.
                </li>
              </ul>
            </section>

            <section>
              <h4>The 13 Parts Explained</h4>
              <div class="parts-grid">
                <div><span class="part-name">Frame</span> — The carbon fiber skeleton that holds everything together. Size (3", 5", 7") determines what other parts you need.</div>
                <div><span class="part-name">Motors (x4)</span> — Spin the propellers. Bigger motors = more power. Stator size (like 2306) should match your frame size.</div>
                <div><span class="part-name">Propellers (x4)</span> — The spinning blades. Must match frame size and motor shaft size.</div>
                <div><span class="part-name">Battery</span> — Powers everything. "S" count = voltage (4S, 6S). Higher = more power but heavier.</div>
                <div><span class="part-name">Flight Controller (FC)</span> — The brain. Runs Betaflight software, reads sensors, controls motors.</div>
                <div><span class="part-name">ESC</span> — Electronic Speed Controller. Sits between the FC and motors, controlling how fast each motor spins.</div>
                <div><span class="part-name">VTX</span> — Video Transmitter. Sends the camera feed to your goggles wirelessly.</div>
                <div><span class="part-name">Camera</span> — The FPV camera on the drone. Must match your VTX/goggles system.</div>
                <div><span class="part-name">Receiver (RX)</span> — Receives control signals from your handheld transmitter.</div>
                <div><span class="part-name">Transmitter (TX)</span> — The handheld controller you hold. Sends stick inputs to the receiver.</div>
                <div><span class="part-name">Goggles</span> — What you wear to see the live video feed. Must match VTX/camera system.</div>
                <div><span class="part-name">Antenna</span> — For video or control signal. Better antennas = better range and image.</div>
                <div><span class="part-name">Other</span> — Accessories: GPS, buzzer, LEDs, action camera, etc.</div>
              </div>
            </section>

            <section>
              <h4>Saving & Loading</h4>
              <p>
                Click <strong>BUILDS</strong> in the top right to save your build, load a previously
                saved one, or export/import as JSON or CSV files. Builds are saved in your browser's
                local storage — they'll be there when you come back, but only on this device/browser.
              </p>
            </section>

            <section>
              <h4>AI Assistant</h4>
              <p>
                Click the <strong>AI</strong> button in the bottom-right corner to chat with an
                AI that understands FPV builds. It can see your current build and answer questions
                like "Is this build compatible?", "What motor should I use for a 5-inch build?",
                or "What's wrong with my setup?".
              </p>
              <p>
                To use it, you'll need a free API key from
                <strong>openrouter.ai</strong> — set it in <strong>SETTINGS</strong>.
              </p>
            </section>

            <section>
              <h4>Adding Custom Parts</h4>
              <p>
                Click <strong>IMPORT URL</strong> in the top bar to add parts that aren't in the
                built-in list. You can paste a product URL from any FPV shop (GetFPV, RaceDayQuads,
                Amazon, etc.) and the AI will scan the page and figure out the specs. You can also
                just paste the product description text if the URL doesn't work.
              </p>
              <p>
                Custom parts are saved in your browser and will appear alongside the built-in presets
                when you browse a category.
              </p>
            </section>

            <section>
              <h4>Beginner Build Recommendations</h4>
              <p>If you're just starting out, here's a rough guide:</p>
              <ul>
                <li><strong>First build?</strong> Start with a 5" quad — it's the most popular size with the most parts available.</li>
                <li><strong>Budget video:</strong> Analog is cheapest but lowest quality. DJI and Walksnail offer HD but cost more.</li>
                <li><strong>Radio:</strong> ELRS is the most popular choice right now — fast, cheap, open-source.</li>
                <li><strong>Battery:</strong> 6S is standard for 5" quads. 4S works but 6S is more efficient for the same power.</li>
              </ul>
            </section>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
defineProps({ show: Boolean })
defineEmits(['close'])
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 50;
  backdrop-filter: blur(4px);
}

.modal-content {
  width: 600px;
  max-width: 90vw;
  max-height: 85vh;
  overflow-y: auto;
  padding: 24px;
}

.help-content section {
  margin-bottom: 20px;
}

.help-content h4 {
  font-family: 'Orbitron', sans-serif;
  font-size: 13px;
  font-weight: 700;
  color: var(--color-tron-cyan);
  margin-bottom: 8px;
  padding-bottom: 4px;
  border-bottom: 1px solid rgba(0, 240, 255, 0.1);
}

.help-content p {
  font-size: 13px;
  line-height: 1.7;
  color: var(--color-tron-text);
  margin-bottom: 8px;
}

.help-content ul, .help-content ol {
  padding-left: 20px;
  margin-bottom: 8px;
}

.help-content li {
  font-size: 13px;
  line-height: 1.6;
  color: var(--color-tron-text);
  margin-bottom: 4px;
}

.help-content strong {
  color: var(--color-tron-text-bright);
}

.parts-grid {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.parts-grid > div {
  font-size: 12px;
  line-height: 1.5;
  color: var(--color-tron-text);
  padding: 4px 0;
  border-bottom: 1px solid rgba(0, 240, 255, 0.05);
}

.part-name {
  color: var(--color-tron-cyan);
  font-weight: 600;
  font-family: 'Rajdhani', sans-serif;
}

.modal-enter-active, .modal-leave-active {
  transition: opacity 0.2s ease;
}
.modal-enter-from, .modal-leave-to {
  opacity: 0;
}
</style>
