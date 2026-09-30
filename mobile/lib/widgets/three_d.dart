import 'dart:math' as math;

import 'package:flutter/material.dart';

import '../theme.dart';
import 'glass.dart';

/// Tilts its child in 3D toward the finger while it is pressed, then springs back.
///
/// Uses a raw pointer [Listener] rather than a gesture recogniser, so it never
/// steals taps or scrolls from the child or the surrounding list.
class Tilt3D extends StatefulWidget {
  const Tilt3D({super.key, required this.child, this.maxAngle = 0.13});

  final Widget child;
  final double maxAngle;

  @override
  State<Tilt3D> createState() => _Tilt3DState();
}

class _Tilt3DState extends State<Tilt3D> {
  Offset _tilt = Offset.zero; // each axis -1..1

  void _update(PointerEvent event) {
    final box = context.findRenderObject() as RenderBox?;
    if (box == null || !box.hasSize || box.size.isEmpty) return;
    final p = event.localPosition;
    setState(() {
      _tilt = Offset(
        ((p.dx / box.size.width) * 2 - 1).clamp(-1.0, 1.0),
        ((p.dy / box.size.height) * 2 - 1).clamp(-1.0, 1.0),
      );
    });
  }

  void _reset(PointerEvent _) => setState(() => _tilt = Offset.zero);

  @override
  Widget build(BuildContext context) {
    final still = reduceMotion(context);
    final matrix = Matrix4.identity()
      ..setEntry(3, 2, 0.0014)
      ..rotateX(still ? 0 : -_tilt.dy * widget.maxAngle)
      ..rotateY(still ? 0 : _tilt.dx * widget.maxAngle);
    return Listener(
      onPointerDown: _update,
      onPointerMove: _update,
      onPointerUp: _reset,
      onPointerCancel: _reset,
      child: AnimatedContainer(
        duration: _tilt == Offset.zero
            ? const Duration(milliseconds: 420)
            : const Duration(milliseconds: 90),
        curve: _tilt == Offset.zero ? Curves.elasticOut : Curves.easeOut,
        transform: matrix,
        transformAlignment: Alignment.center,
        child: widget.child,
      ),
    );
  }
}

/// A chunky pseudo-3D icon: many thin copies of the glyph stacked along the Z axis
/// under a perspective transform, so it has visible depth as it sways. Drag to spin it;
/// it eases back when released.
class Layered3DIcon extends StatefulWidget {
  const Layered3DIcon({
    super.key,
    required this.icon,
    this.size = 120,
    this.color = Palette.accent,
    this.overlayIcon,
    this.depth = 26,
  });

  final IconData icon;
  final double size;
  final Color color;

  /// Optional glyph engraved on the front face (e.g. a tick on a shield).
  final IconData? overlayIcon;

  /// Total thickness in logical pixels.
  final double depth;

  @override
  State<Layered3DIcon> createState() => _Layered3DIconState();
}

class _Layered3DIconState extends State<Layered3DIcon>
    with TickerProviderStateMixin {
  late final AnimationController _sway = AnimationController(
    vsync: this,
    duration: const Duration(seconds: 7),
  );
  late final AnimationController _spring = AnimationController(
    vsync: this,
    duration: const Duration(milliseconds: 900),
  );
  Offset _drag = Offset.zero; // radians (x = yaw, y = pitch)
  Offset _dragFrom = Offset.zero;

  static const _layers = 14;

  @override
  void initState() {
    super.initState();
    _spring.addListener(() {
      setState(
        () => _drag = Offset.lerp(
          _dragFrom,
          Offset.zero,
          Curves.elasticOut.transform(_spring.value),
        )!,
      );
    });
  }

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    if (reduceMotion(context)) {
      _sway.stop();
    } else if (!_sway.isAnimating) {
      _sway.repeat();
    }
  }

  @override
  void dispose() {
    _sway.dispose();
    _spring.dispose();
    super.dispose();
  }

  Color _shade(int layer) {
    // Back layers are darker; the front layer gets the full colour.
    final t = layer / (_layers - 1);
    return Color.lerp(
      HSLColor.fromColor(widget.color).withLightness(0.16).toColor(),
      widget.color,
      t,
    )!;
  }

  @override
  Widget build(BuildContext context) {
    final size = widget.size;
    return GestureDetector(
      onPanStart: (_) => _spring.stop(),
      onPanUpdate: (d) => setState(() {
        _drag += Offset(d.delta.dx * 0.012, -d.delta.dy * 0.012);
        _drag = Offset(_drag.dx.clamp(-1.6, 1.6), _drag.dy.clamp(-0.8, 0.8));
      }),
      onPanEnd: (_) {
        _dragFrom = _drag;
        _spring.forward(from: 0);
      },
      child: SizedBox(
        width: size * 1.5,
        height: size * 1.5,
        child: Stack(
          alignment: Alignment.center,
          children: [
            // Ground glow
            Container(
              width: size * 1.25,
              height: size * 1.25,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                gradient: RadialGradient(
                  colors: [
                    widget.color.withValues(alpha: 0.4),
                    widget.color.withValues(alpha: 0),
                  ],
                ),
              ),
            ),
            AnimatedBuilder(
              animation: _sway,
              builder: (context, _) {
                final sway = math.sin(_sway.value * 2 * math.pi) * 0.55;
                final matrix = Matrix4.identity()
                  ..setEntry(3, 2, 0.0011)
                  ..rotateX(_drag.dy - 0.12)
                  ..rotateY(sway + _drag.dx);
                return Transform(
                  transform: matrix,
                  alignment: Alignment.center,
                  child: Stack(
                    alignment: Alignment.center,
                    children: [
                      for (var i = 0; i < _layers; i++)
                        Transform(
                          transform: Matrix4.translationValues(
                            0,
                            0,
                            (i - (_layers - 1)) * (widget.depth / _layers),
                          ),
                          alignment: Alignment.center,
                          child: Icon(
                            widget.icon,
                            size: size,
                            color: _shade(i),
                          ),
                        ),
                      if (widget.overlayIcon != null)
                        Transform(
                          transform: Matrix4.translationValues(0, 0, 1.5),
                          alignment: Alignment.center,
                          child: Icon(
                            widget.overlayIcon,
                            size: size * 0.46,
                            color: Colors.white.withValues(alpha: 0.92),
                          ),
                        ),
                    ],
                  ),
                );
              },
            ),
          ],
        ),
      ),
    );
  }
}
