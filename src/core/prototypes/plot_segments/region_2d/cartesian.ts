import * as Graphics from "../../../graphics";
import {
  ConstraintSolver,
  ConstraintStrength,
  VariableStrength
} from "../../../solver";
import * as Specification from "../../../specification";

import { getById, max, Point, uniqueID } from "../../../common";
import {
  AttributeDescription,
  BoundingBox,
  Controls,
  DropZones,
  Handles,
  ObjectClasses,
  ObjectClassMetadata,
  SnappingGuides,
  TemplateParameters
} from "../../common";

import { ChartStateManager } from "../..";
import { BuildConstraintsContext } from "../../chart_element";
import { DataflowTable } from "../../dataflow";
import { AxisRenderer } from "../axis";
import { PlotSegmentClass } from "../index";
import {
  Region2DAttributes,
  Region2DConfiguration,
  Region2DConstraintBuilder,
  Region2DPlotSegment
} from "./base";

export type CartesianAxisMode =
  | "null"
  | "default"
  | "numerical"
  | "categorical";

export interface CartesianAttributes extends Region2DAttributes {
  /** Cartesian plot segment region */
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

export interface CartesianState extends Specification.PlotSegmentState {
  attributes: CartesianAttributes;
}

export let cartesianTerminology: Region2DConfiguration = {
  terminology: {
    xAxis: "X Axis", // X Axis / Angular Axis
    yAxis: "Y Axis", // Y Axis / Radial Axis
    xMin: "Left",
    xMinIcon: "align/left",
    xMiddle: "Middle",
    xMiddleIcon: "align/x-middle",
    xMax: "Right",
    xMaxIcon: "align/right",
    yMiddle: "Middle",
    yMiddleIcon: "align/y-middle",
    yMin: "Bottom",
    yMinIcon: "align/bottom",
    yMax: "Top",
    yMaxIcon: "align/top",
    dodgeX: "Stack X",
    dodgeXIcon: "sublayout/dodge-x",
    dodgeY: "Stack Y",
    dodgeYIcon: "sublayout/dodge-y",
    grid: "Grid",
    gridIcon: "sublayout/grid",
    gridDirectionX: "X",
    gridDirectionY: "Y",
    packing: "Packing",
    packingIcon: "sublayout/packing"
  },
  xAxisPrePostGap: false,
  yAxisPrePostGap: false
};

export class CartesianPlotSegment extends Region2DPlotSegment {
  public static classID: string = "plot-segment.cartesian";
  public static type: string = "plot-segment";

  public static metadata: ObjectClassMetadata = {
    displayName: "PlotSegment",
    iconPath: "plot-segment/cartesian",
    creatingInteraction: {
      type: "rectangle",
      mapping: { xMin: "x1", yMin: "y1", xMax: "x2", yMax: "y2" }
    }
  };

  public static defaultMappingValues: Specification.AttributeMap = {};

  public static defaultProperties: Specification.AttributeMap = {
    marginX1: 0,
    marginY1: 0,
    marginX2: 0,
    marginY2: 0,
    visible: true,
    sublayout: {
      type: "dodge-x",
      order: null,
      ratioX: 0.1,
      ratioY: 0.1,
      align: {
        x: "start",
        y: "start"
      },
      grid: {
        direction: "x",
        xCount: null,
        yCount: null
      }
    }
  };

  public readonly state: CartesianState;

  public attributeNames: string[] = ["x1", "x2", "y1", "y2", "gapX", "gapY"];
  public attributes: { [name: string]: AttributeDescription } = {
    x1: {
      name: "x1",
      type: "number",
      mode: "positional",
      strength: VariableStrength.NONE
    },
    x2: {
      name: "x2",
      type: "number",
      mode: "positional",
      strength: VariableStrength.NONE
    },
    y1: {
      name: "y1",
      type: "number",
      mode: "positional",
      strength: VariableStrength.NONE
    },
    y2: {
      name: "y2",
      type: "number",
      mode: "positional",
      strength: VariableStrength.NONE
    },
    x: {
      name: "x",
      type: "number",
      mode: "positional",
      strength: VariableStrength.NONE
    },
    y: {
      name: "y",
      type: "number",
      mode: "positional",
      strength: VariableStrength.NONE
    },
    gapX: {
      name: "gapX",
      type: "number",
      mode: "positional",
      strength: VariableStrength.NONE
    },
    gapY: {
      name: "gapY",
      type: "number",
      mode: "positional",
      strength: VariableStrength.NONE
    }
  };

  public initializeState(): void {
    const attrs = this.state.attributes;
    attrs.x1 = -100;
    attrs.x2 = 100;
    attrs.y1 = -100;
    attrs.y2 = 100;
    attrs.gapX = 4;
    attrs.gapY = 4;
    attrs.x = attrs.x1;
    attrs.y = attrs.y2;
  }

  public createBuilder(
    solver?: ConstraintSolver,
    context?: BuildConstraintsContext
  ) {
    const builder = new Region2DConstraintBuilder(
      this,
      cartesianTerminology,
      "x1",
      "x2",
      "y1",
      "y2",
      solver,
      context
    );
    return builder;
  }

  public buildConstraints(
    solver: ConstraintSolver,
    context: BuildConstraintsContext
  ): void {
    const builder = this.createBuilder(solver, context);
    builder.build();
  }

  public getBoundingBox(): BoundingBox.Description {
    const attrs = this.state.attributes;
    const { x1, x2, y1, y2 } = attrs;
    return {
      type: "rectangle",
      cx: (x1 + x2) / 2,
      cy: (y1 + y2) / 2,
      width: Math.abs(x2 - x1),
      height: Math.abs(y2 - y1),
      rotation: 0
    } as BoundingBox.Rectangle;
  }

  public getSnappingGuides(): SnappingGuides.Description[] {
    const attrs = this.state.attributes;
    const { x1, y1, x2, y2 } = attrs;
    return [
      { type: "x", value: x1, attribute: "x1" } as SnappingGuides.Axis,
      { type: "x", value: x2, attribute: "x2" } as SnappingGuides.Axis,
      { type: "y", value: y1, attribute: "y1" } as SnappingGuides.Axis,
      { type: "y", value: y2, attribute: "y2" } as SnappingGuides.Axis
    ];
  }

  public getAttributePanelWidgets(
    manager: Controls.WidgetManager
  ): Controls.Widget[] {
    const builder = this.createBuilder();
    return [...builder.buildPanelWidgets(manager)];
  }

  public getPopupEditor(manager: Controls.WidgetManager): Controls.PopupEditor {
    const builder = this.createBuilder();
    const widgets = builder.buildPopupWidgets(manager);
    if (widgets.length == 0) {
      return null;
    }
    const attrs = this.state.attributes;
    const props = this.object.properties;
    const anchor = { x: attrs.x1, y: attrs.y2 };
    return {
      anchor,
      widgets: [...widgets]
    };
  }

  public getGraphics(manager: ChartStateManager): Graphics.Group {
    const builder = this.createBuilder();
    const g = Graphics.makeGroup([]);
    const attrs = this.state.attributes;
    const props = this.object.properties;
    const [xMode, yMode] = this.getAxisModes();
    const getTickData = (axis: Specification.Types.AxisDataBinding) => {
      const table = manager.getTable(this.object.table);
      const axisExpression = manager.dataflow.cache.parse(axis.expression);
      const tickDataExpression = manager.dataflow.cache.parse(
        axis.tickDataExpression
      );
      const result = [];
      for (let i = 0; i < table.rows.length; i++) {
        const c = table.getRowContext(i);
        const axisValue = axisExpression.getValue(c);
        const tickData = tickDataExpression.getValue(c);
        result.push({ value: axisValue, tick: tickData });
      }
      return result;
    };
    if (props.xData && props.xData.visible) {
      const axisRenderer = new AxisRenderer().setAxisDataBinding(
        props.xData,
        0,
        attrs.x2 - attrs.x1,
        false
      );
      if (props.xData.tickDataExpression) {
        axisRenderer.setTicksByData(getTickData(props.xData));
      }
      g.elements.push(
        axisRenderer.renderCartesian(
          attrs.x1,
          props.xData.side != "default" ? attrs.y2 : attrs.y1,
          "x"
        )
      );
    }
    if (props.yData && props.yData.visible) {
      const axisRenderer = new AxisRenderer().setAxisDataBinding(
        props.yData,
        0,
        attrs.y2 - attrs.y1,
        false
      );
      if (props.yData.tickDataExpression) {
        axisRenderer.setTicksByData(getTickData(props.yData));
      }
      g.elements.push(
        axisRenderer.renderCartesian(
          props.yData.side != "default" ? attrs.x2 : attrs.x1,
          attrs.y1,
          "y"
        )
      );
    }
    return g;
  }

  public getDropZones(): DropZones.Description[] {
    const attrs = this.state.attributes;
    const { x1, y1, x2, y2, x, y } = attrs;
    const zones: DropZones.Description[] = [];
    zones.push({
      type: "region",
      accept: { scaffolds: ["cartesian-y"] },
      dropAction: { extendPlotSegment: {} },
      p1: { x: x1, y: y1 },
      p2: { x: x2, y: y2 },
      title: "Add Y Scaffold"
    } as DropZones.Region);
    zones.push({
      type: "region",
      accept: { scaffolds: ["cartesian-x"] },
      dropAction: { extendPlotSegment: {} },
      p1: { x: x1, y: y1 },
      p2: { x: x2, y: y2 },
      title: "Add X Scaffold"
    } as DropZones.Region);
    zones.push({
      type: "region",
      accept: { scaffolds: ["polar"] },
      dropAction: { extendPlotSegment: {} },
      p1: { x: x1, y: y1 },
      p2: { x: x2, y: y2 },
      title: "Convert to Polar Coordinates"
    } as DropZones.Region);
    zones.push({
      type: "region",
      accept: { scaffolds: ["curve"] },
      dropAction: { extendPlotSegment: {} },
      p1: { x: x1, y: y1 },
      p2: { x: x2, y: y2 },
      title: "Convert to Curve Coordinates"
    } as DropZones.Region);
    zones.push({
      type: "region",
      accept: { scaffolds: ["map"] },
      dropAction: { extendPlotSegment: {} },
      p1: { x: x1, y: y1 },
      p2: { x: x2, y: y2 },
      title: "Convert to Map"
    } as DropZones.Region);
    zones.push({
      type: "line",
      p1: { x: x2, y: y1 },
      p2: { x: x1, y: y1 },
      title: "X Axis",
      dropAction: {
        axisInference: { property: "xData" }
      }
    } as DropZones.Line);
    zones.push({
      type: "line",
      p1: { x: x1, y: y1 },
      p2: { x: x1, y: y2 },
      title: "Y Axis",
      dropAction: {
        axisInference: { property: "yData" }
      }
    } as DropZones.Line);
    return zones;
  }

  public getAxisModes(): [CartesianAxisMode, CartesianAxisMode] {
    const props = this.object.properties;
    return [
      props.xData ? props.xData.type : "null",
      props.yData ? props.yData.type : "null"
    ];
  }

  public getHandles(): Handles.Description[] {
    const attrs = this.state.attributes;
    const rows = this.parent.dataflow.getTable(this.object.table).rows;
    const { x1, x2, y1, y2 } = attrs;
    const h: Handles.Description[] = [
      {
        type: "line",
        axis: "y",
        value: y1,
        span: [x1, x2],
        actions: [{ type: "attribute", attribute: "y1" }]
      } as Handles.Line,
      {
        type: "line",
        axis: "y",
        value: y2,
        span: [x1, x2],
        actions: [{ type: "attribute", attribute: "y2" }]
      } as Handles.Line,
      {
        type: "line",
        axis: "x",
        value: x1,
        span: [y1, y2],
        actions: [{ type: "attribute", attribute: "x1" }]
      } as Handles.Line,
      {
        type: "line",
        axis: "x",
        value: x2,
        span: [y1, y2],
        actions: [{ type: "attribute", attribute: "x2" }]
      } as Handles.Line,
      {
        type: "point",
        x: x1,
        y: y1,
        actions: [
          { type: "attribute", source: "x", attribute: "x1" },
          { type: "attribute", source: "y", attribute: "y1" }
        ]
      } as Handles.Point,
      {
        type: "point",
        x: x2,
        y: y1,
        actions: [
          { type: "attribute", source: "x", attribute: "x2" },
          { type: "attribute", source: "y", attribute: "y1" }
        ]
      } as Handles.Point,
      {
        type: "point",
        x: x1,
        y: y2,
        actions: [
          { type: "attribute", source: "x", attribute: "x1" },
          { type: "attribute", source: "y", attribute: "y2" }
        ]
      } as Handles.Point,
      {
        type: "point",
        x: x2,
        y: y2,
        actions: [
          { type: "attribute", source: "x", attribute: "x2" },
          { type: "attribute", source: "y", attribute: "y2" }
        ]
      } as Handles.Point
    ];

    const builder = this.createBuilder();

    const handles = builder.getHandles();
    for (const handle of handles) {
      h.push({
        type: "gap-ratio",
        axis: handle.gap.axis,
        reference: handle.gap.reference,
        value: handle.gap.value,
        scale: handle.gap.scale,
        span: handle.gap.span,
        range: [0, 1],
        coordinateSystem: this.getCoordinateSystem(),
        actions: [
          {
            type: "property",
            property: handle.gap.property.property,
            field: handle.gap.property.field
          }
        ]
      } as Handles.GapRatio);
    }

    return h;
  }

  public getTemplateParameters(): TemplateParameters {
    const r: Specification.Template.Inference[] = [];
    if (
      this.object.properties.xData &&
      this.object.properties.xData.type != "default"
    ) {
      r.push({
        type: "axis",
        property: "xData",
        slotKind: this.object.properties.xData.type,
        slotName: this.object.properties.xData.expression
      } as Specification.Template.Axis);
    }
    if (
      this.object.properties.yData &&
      this.object.properties.yData.type != "default"
    ) {
      r.push({
        type: "axis",
        property: "yData",
        slotKind: this.object.properties.yData.type,
        slotName: this.object.properties.yData.expression
      } as Specification.Template.Axis);
    }
    if (this.object.properties.sublayout.order) {
      r.push({
        type: "order",
        property: "sublayout",
        field: "order",
        slotName: this.object.properties.sublayout.order
      } as Specification.Template.Order);
    }
    return { inferences: r };
  }
}

ObjectClasses.Register(CartesianPlotSegment);
