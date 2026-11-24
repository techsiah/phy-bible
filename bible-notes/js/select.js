/* Premium dropdowns.
   The native <select> stays in the DOM (and in the form) as the single source
   of truth. Each one gets a styled trigger and a floating listbox so the
   closed control matches the app instead of looking like a browser default. */

let openState = null;

function closeOpen() {
  if (!openState) return;
  const { menu, shell, trigger, detach } = openState;
  openState = null;
  menu.hidden = true;
  shell.classList.remove('is-open');
  trigger.setAttribute('aria-expanded', 'false');
  detach();
}

function labelFor(select) {
  const field = select.closest('.field');
  const label = field && field.querySelector('.field-label');
  const text = label ? label.textContent : (select.name || 'Choose');
  return text.replace(/\s+/g, ' ').trim();
}

function enhanceSelect(select) {
  if (select.dataset.enhanced === '1') return;
  select.dataset.enhanced = '1';

  const shell = document.createElement('div');
  shell.className = 'select-shell';
  select.parentNode.insertBefore(shell, select);
  shell.appendChild(select);

  const labelText = labelFor(select);

  const trigger = document.createElement('button');
  trigger.type = 'button';
  trigger.className = 'select-trigger';
  trigger.setAttribute('aria-haspopup', 'listbox');
  trigger.setAttribute('aria-expanded', 'false');

  const valueEl = document.createElement('span');
  valueEl.className = 'select-value';

  const caret = document.createElement('span');
  caret.className = 'select-caret';
  caret.setAttribute('aria-hidden', 'true');
  caret.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>';

  trigger.append(valueEl, caret);

  const menu = document.createElement('div');
  menu.className = 'select-menu';
  menu.id = `${select.id || 'select'}-menu`;
  menu.setAttribute('role', 'listbox');
  menu.setAttribute('aria-label', labelText);
  menu.hidden = true;

  trigger.setAttribute('aria-controls', menu.id);
  shell.append(trigger);

  /* The floating list lives in the dialog so it stays above the modal. */
  const dialog = select.closest('dialog');
  (dialog || document.body).append(menu);

  select.tabIndex = -1;
  select._focusTarget = trigger;

  let activeIndex = -1;

  function items() {
    return [...menu.querySelectorAll('.select-option')];
  }

  function enabledIndexes() {
    return items().map((item, i) => (item.disabled ? -1 : i)).filter((i) => i >= 0);
  }

  function build() {
    menu.innerHTML = '';
    [...select.options].forEach((opt) => {
      if (opt.hidden) return;
      const item = document.createElement('button');
      item.type = 'button';
      item.className = 'select-option';
      item.setAttribute('role', 'option');
      item.dataset.value = opt.value;
      item.textContent = opt.textContent;
      item.disabled = opt.disabled;
      item.setAttribute('aria-selected', 'false');
      menu.append(item);
    });
    if (!menu.children.length) {
      const empty = document.createElement('div');
      empty.className = 'select-empty';
      empty.textContent = 'No options available';
      menu.append(empty);
    }
  }

  function sync() {
    const opt = select.options[select.selectedIndex];
    const placeholder = !select.value;
    const text = opt && opt.textContent ? opt.textContent : 'Select';
    valueEl.textContent = text;
    trigger.dataset.placeholder = String(placeholder);
    trigger.setAttribute('aria-label', `${labelText}: ${text}`);
    items().forEach((item) => {
      item.setAttribute('aria-selected', String(!placeholder && item.dataset.value === select.value));
    });
  }

  function position() {
    const rect = trigger.getBoundingClientRect();
    const margin = 8;
    const width = Math.min(Math.max(rect.width, 180), window.innerWidth - margin * 2);
    menu.style.width = `${width}px`;
    menu.style.maxHeight = '280px';

    const measured = Math.min(menu.scrollHeight, 280);
    const left = Math.max(margin, Math.min(rect.left, window.innerWidth - width - margin));
    menu.style.left = `${left}px`;

    const below = window.innerHeight - rect.bottom - margin * 2;
    const above = rect.top - margin * 2;
    if (below >= measured || below >= above) {
      menu.style.top = `${rect.bottom + margin}px`;
      menu.style.maxHeight = `${Math.max(120, below)}px`;
    } else {
      const height = Math.min(measured, above);
      menu.style.top = `${Math.max(margin, rect.top - margin - height)}px`;
      menu.style.maxHeight = `${Math.max(120, above)}px`;
    }
  }

  function setActive(index) {
    const all = items();
    const enabled = enabledIndexes();
    if (!all.length || !enabled.length) return;
    let next = index;
    if (!enabled.includes(next)) {
      next = enabled.reduce((best, i) => (Math.abs(i - index) < Math.abs(best - index) ? i : best), enabled[0]);
    }
    activeIndex = next;
    all.forEach((item, i) => item.classList.toggle('is-active', i === next));
    all[next].scrollIntoView({ block: 'nearest' });
  }

  function firstEnabled() {
    const enabled = enabledIndexes();
    return enabled.length ? enabled[0] : 0;
  }

  function open() {
    if (openState) closeOpen();
    build();
    sync();
    menu.hidden = false;
    shell.classList.add('is-open');
    trigger.setAttribute('aria-expanded', 'true');
    position();

    const all = items();
    const selected = all.findIndex((item) => item.getAttribute('aria-selected') === 'true');
    setActive(selected >= 0 ? selected : firstEnabled());
    all[activeIndex]?.focus({ preventScroll: true });

    const onPointer = (e) => {
      if (!shell.contains(e.target) && !menu.contains(e.target)) close();
    };
    const onScroll = (e) => {
      if (e.target !== menu) close();
    };
    const onResize = () => close();

    document.addEventListener('pointerdown', onPointer, true);
    window.addEventListener('scroll', onScroll, true);
    window.addEventListener('resize', onResize);

    openState = {
      menu,
      shell,
      trigger,
      detach() {
        document.removeEventListener('pointerdown', onPointer, true);
        window.removeEventListener('scroll', onScroll, true);
        window.removeEventListener('resize', onResize);
      }
    };
  }

  function close() {
    if (openState && openState.menu === menu) closeOpen();
    else {
      menu.hidden = true;
      shell.classList.remove('is-open');
      trigger.setAttribute('aria-expanded', 'false');
    }
  }

  function choose(value) {
    select.value = value;
    shell.classList.remove('is-invalid');
    sync();
    close();
    trigger.focus({ preventScroll: true });
    select.dispatchEvent(new Event('change', { bubbles: true }));
  }

  trigger.addEventListener('click', () => {
    if (menu.hidden) open();
    else close();
  });

  trigger.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      if (menu.hidden) open();
      else setActive(activeIndex + (e.key === 'ArrowUp' ? -1 : 1));
    } else if (e.key === 'Escape' && !menu.hidden) {
      e.preventDefault();
      close();
    }
  });

  menu.addEventListener('click', (e) => {
    const item = e.target.closest('.select-option');
    if (!item || item.disabled) return;
    choose(item.dataset.value);
  });

  menu.addEventListener('keydown', (e) => {
    const all = items();
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive(activeIndex + 1);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive(activeIndex - 1);
    } else if (e.key === 'Home') {
      e.preventDefault();
      setActive(firstEnabled());
    } else if (e.key === 'End') {
      e.preventDefault();
      setActive(enabledIndexes().slice(-1)[0] ?? 0);
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      const item = all[activeIndex];
      if (item && !item.disabled) choose(item.dataset.value);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      close();
      trigger.focus({ preventScroll: true });
    } else if (e.key === 'Tab') {
      close();
    }
  });

  select.addEventListener('change', () => {
    shell.classList.remove('is-invalid');
    sync();
  });

  select.addEventListener('invalid', () => {
    shell.classList.add('is-invalid');
  });

  const label = select.closest('label.field') || select.closest('.field');
  if (label) {
    label.addEventListener('click', (e) => {
      if (e.target.closest('.select-shell')) return;
      e.preventDefault();
      trigger.focus({ preventScroll: true });
      open();
    });
  }

  if (dialog) dialog.addEventListener('close', close);

  build();
  sync();
}

export function enhanceSelects(root = document) {
  root.querySelectorAll('select').forEach(enhanceSelect);
}
