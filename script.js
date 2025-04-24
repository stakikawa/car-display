(() => {
    const TAX_RATE    = 0.12;
    const DEFAULT_FEE = 1000;
  
    const fileInput   = document.getElementById('fileInput');
    const fileBtn     = document.getElementById('fileBtn');
    const fileNameEl  = document.getElementById('fileName');
    const tabsEl      = document.getElementById('tabs');
    const contentsEl  = document.getElementById('tabContents');
  
    let slideIdxSub = [];
  
    fileBtn.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', e => {
      const file = e.target.files[0];
      if (!file) return;
      fileNameEl.textContent = file.name;
      const reader = new FileReader();
      reader.onload = evt => {
        try {
          const cars = JSON.parse(evt.target.result);
          buildUI(cars);
        } catch {
          alert('⚠️ Invalid JSON format');
        }
      };
      reader.readAsText(file);
    });
  
    function buildUI(cars) {
      // Group by make
      const groups = cars.reduce((acc, car) => {
        const mk = car.make || 'Other';
        (acc[mk] = acc[mk] || []).push(car);
        return acc;
      }, {});
      const makes = Object.keys(groups);
  
      tabsEl.innerHTML = '';
      contentsEl.innerHTML = '';
      slideIdxSub = makes.map(mk => groups[mk].map(() => 0));
  
      makes.forEach((mk, gi) => {
        // Make tab
        const btn = document.createElement('button');
        btn.textContent = mk;
        btn.onclick = () => activateMake(gi);
        tabsEl.appendChild(btn);
  
        // Make pane
        const makePane = document.createElement('div');
        makePane.className = 'tab-content';
  
        // Sub-tabs + contents
        const subTabs = document.createElement('nav');
        subTabs.className = 'sub-tabs';
        const subContents = document.createElement('div');
        subContents.className = 'sub-contents';
  
        groups[mk].forEach((car, ci) => {
          // Sub-tab
          const sbtn = document.createElement('button');
          sbtn.textContent = car.name;
          sbtn.onclick = () => activateCar(gi, ci);
          subTabs.appendChild(sbtn);
  
          // Car card
          const pane = document.createElement('div');
          pane.className = 'tab-content card';
  
          // Pricing calculations
          const fee       = car.dealershipFee != null ? car.dealershipFee : DEFAULT_FEE;
          const price     = Number(car.price);
          const preTotal  = car.postTax ? price - fee : price + fee;
          const postTotal = car.postTax
            ? price
            : preTotal * (1 + TAX_RATE);
  
          // Slideshow (unchanged)
          const slideWrap = document.createElement('div');
          slideWrap.className = 'slideshow';
          (car.images||[]).forEach((src, j) => {
            const img = document.createElement('img');
            img.src = src;
            if (j === 0) img.classList.add('active');
            slideWrap.appendChild(img);
          });
          const arrows = document.createElement('div');
          arrows.className = 'arrows';
          ['prev','next'].forEach(dir => {
            const b = document.createElement('button');
            b.innerHTML = dir==='prev' ? '&larr;' : '&rarr;';
            b.onclick = () => changeSlide(gi, ci, dir==='next'?1:-1);
            arrows.appendChild(b);
          });
          slideWrap.appendChild(arrows);
          pane.appendChild(slideWrap);
  
          // Dots (unchanged)
          const dots = document.createElement('div');
          dots.className = 'dots';
          (car.images||[]).forEach((_, j) => {
            const dot = document.createElement('span');
            dot.onclick = () => showSlide(gi, ci, j);
            if (j === 0) dot.classList.add('active');
            dots.appendChild(dot);
          });
          pane.appendChild(dots);
  
          // Details
          const det = document.createElement('div');
          det.className = 'details';
  
          // Year
          if (car.year != null) {
            const pYear = document.createElement('p');
            pYear.className = 'year';
            pYear.textContent = `Year: ${car.year}`;
            det.appendChild(pYear);
          }
  
          // Features list
          if (car.features) {
            const ul = document.createElement('ul');
            car.features.forEach(f => {
              const li = document.createElement('li');
              li.textContent = f;
              ul.appendChild(li);
            });
            det.appendChild(ul);
          }
  
          // Pricing grid (rounded)
          const pricingEl = document.createElement('div');
          pricingEl.className = 'pricing';
          [
            { label: 'Price',    value: `$${Math.round(price).toLocaleString()}` },
            { label: 'Fee',      value: `$${Math.round(fee).toLocaleString()}` },
            { label: 'Pre-Tax',  value: `$${Math.round(preTotal).toLocaleString()}` },
            { label: 'Post-Tax', value: `$${Math.round(postTotal).toLocaleString()}` }
          ].forEach(item => {
            const div = document.createElement('div');
            div.className = 'price-item';
            const spanL = document.createElement('span');
            spanL.className = 'label';
            spanL.textContent = item.label;
            const spanV = document.createElement('span');
            spanV.className = 'value';
            spanV.textContent = item.value;
            div.appendChild(spanL);
            div.appendChild(spanV);
            pricingEl.appendChild(div);
          });
          det.appendChild(pricingEl);
  
          // Mileage in km
          if (car.mileage != null) {
            const m = document.createElement('p');
            m.textContent = `Mileage: ${car.mileage.toLocaleString()} km`;
            det.appendChild(m);
          }
  
          // -- NEW: Notes panel --
          if (car.notes) {
            const notesWrap = document.createElement('div');
            notesWrap.className = 'notes-panel';
            const h3 = document.createElement('h3');
            h3.textContent = 'Notes';
            notesWrap.appendChild(h3);
            const p = document.createElement('p');
            p.textContent = car.notes;
            notesWrap.appendChild(p);
            det.appendChild(notesWrap);
          }
  
          // -- NEW: Dealership link --
          if (car.dealershipUrl) {
            const a = document.createElement('a');
            a.href = car.dealershipUrl;
            a.target = '_blank';
            a.rel = 'noopener';
            a.className = 'dealership-link';
            a.textContent = 'View on dealership site →';
            det.appendChild(a);
          }
  
          pane.appendChild(det);
          subContents.appendChild(pane);
        });
  
        makePane.appendChild(subTabs);
        makePane.appendChild(subContents);
        contentsEl.appendChild(makePane);
      });
  
      if (makes.length) {
        activateMake(0);
        activateCar(0, 0);
      }
    }
  
    function activateMake(gIdx) {
      Array.from(tabsEl.children)
        .forEach((b, i) => b.classList.toggle('active', i === gIdx));
      Array.from(contentsEl.children)
        .forEach((p, i) => p.classList.toggle('active', i === gIdx));
      activateCar(gIdx, 0);
    }
  
    function activateCar(gIdx, cIdx) {
      const makePane    = contentsEl.children[gIdx];
      const subTabs     = makePane.querySelector('.sub-tabs');
      const subContents = makePane.querySelector('.sub-contents');
  
      Array.from(subTabs.children)
        .forEach((b, i) => b.classList.toggle('active', i === cIdx));
      Array.from(subContents.children)
        .forEach((p, i) => p.classList.toggle('active', i === cIdx));
    }
  
    function changeSlide(gIdx, cIdx, delta) {
      const imgs = Array.from(
        contentsEl.children[gIdx]
          .querySelectorAll('.tab-content')[cIdx]
          .querySelectorAll('img')
      );
      const total = imgs.length;
      slideIdxSub[gIdx][cIdx] = (slideIdxSub[gIdx][cIdx] + delta + total) % total;
      showSlide(gIdx, cIdx, slideIdxSub[gIdx][cIdx]);
    }
  
    function showSlide(gIdx, cIdx, idx) {
      const pane = contentsEl.children[gIdx]
        .querySelectorAll('.tab-content')[cIdx];
      const imgs = pane.querySelectorAll('img');
      const dots = pane.querySelectorAll('.dots span');
      imgs.forEach((img, i) => img.classList.toggle('active', i === idx));
      dots.forEach((d, i) => d.classList.toggle('active', i === idx));
      slideIdxSub[gIdx][cIdx] = idx;
    }
  })();
  