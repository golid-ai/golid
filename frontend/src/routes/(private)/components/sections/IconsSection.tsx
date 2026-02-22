import { For } from "solid-js";
import { Tooltip } from "~/components/atoms/Tooltip";
import { Link } from "~/components/atoms/Link";
import { Icon } from "~/components/atoms/Icon";

export interface IconsSectionProps {
  onCopy: (text: string, name: string) => void;
}

export function IconsSection(props: IconsSectionProps) {
  const iconGroups = [
    {
      title: "General Actions",
      icons: ["search", "add", "edit", "delete", "save", "close", "check", "refresh", "filter_list", "sort", "download", "upload", "share", "link", "launch", "logout", "undo", "redo", "sync", "sync_problem", "tune", "filter_alt", "layers", "layers_clear", "history_toggle_off", "published_with_changes", "update", "restore", "event", "assignment", "assignment_turned_in", "task_alt", "playlist_add_check", "rule", "done_all", "fact_check"],
    },
    {
      title: "Navigation & UI",
      icons: ["home", "dashboard", "settings", "person", "group", "notifications", "mail", "menu", "more_vert", "more_horiz", "chevron_left", "chevron_right", "expand_more", "expand_less", "apps", "grid_view", "view_quilt", "view_sidebar", "view_stream", "window", "splitscreen", "drag_indicator", "space_dashboard", "explore", "map", "push_pin", "arrow_back", "arrow_forward", "arrow_upward", "arrow_downward", "first_page", "last_page", "navigate_next", "navigate_before", "segment", "view_comfy"],
    },
    {
      title: "Status & Feedback",
      icons: ["check_circle", "info", "warning", "error", "cancel", "help", "pending", "history", "schedule", "bolt", "verified", "stars", "warning_amber", "report", "dangerous", "check_box", "radio_button_checked", "toggle_on", "toggle_off", "notifications_active", "vibration", "priority_high", "notifications_off", "volume_up", "volume_off", "mic", "offline_pin", "online_prediction", "feedback", "hourglass_empty", "hourglass_full", "alarm", "watch_later", "brightness_high", "brightness_low", "error_outline"],
    },
    {
      title: "Data & Content",
      icons: ["bar_chart", "pie_chart", "table_view", "list", "description", "folder", "attachment", "image", "video_library", "database", "terminal", "analytics", "monitoring", "query_stats", "insights", "auto_graph", "timeline", "hub", "troubleshoot", "account_tree", "schema", "storage", "dataset", "view_list", "table_rows", "file_download", "table_chart", "insert_chart", "show_chart", "multiline_chart", "scatter_plot", "bubble_chart", "score", "legend_toggle", "data_exploration", "stacked_line_chart"],
    },
    {
      title: "Connectivity & Hardware",
      icons: ["sensors", "lan", "developer_board", "memory", "dns", "router", "wifi", "wifi_off", "bluetooth", "bluetooth_disabled", "battery_full", "battery_charging_full", "power", "power_off", "usb", "settings_ethernet", "nfc", "hardware", "keyboard", "mouse", "print", "cast", "computer", "laptop", "smartphone", "tablet", "cable", "dock", "monitor", "tv", "speaker", "headset", "videocam", "mic_external_on", "scanner", "cell_tower"],
    },
    {
      title: "Cloud & Intelligence",
      icons: ["cloud", "cloud_done", "cloud_download", "cloud_upload", "cloud_off", "rocket_launch", "favorite", "visibility", "visibility_off", "lock", "lock_open", "vpn_key", "admin_panel_settings", "fingerprint", "face", "language", "public", "translate", "psychology", "smart_toy", "light_mode", "dark_mode", "auto_awesome", "emoji_objects", "model_training", "dataset_linked", "electric_bolt", "energy_savings_leaf", "eco", "auto_fix_high", "generating_tokens", "mediation", "architecture", "science", "biotech", "precision_manufacturing"],
    },
  ];

  return (
    <section class="mb-16">
      <div class="flex items-baseline justify-between mb-6 border-b border-brand-white/20 pb-2">
        <h2 class="text-2xl font-semibold text-brand-light">Icons</h2>
        <Link
          href="https://fonts.google.com/icons?icon.style=Rounded"
          target="_blank"
          rel="noopener noreferrer"
          class="text-[10px] font-mono font-bold uppercase tracking-widest"
        >
          Google Material Symbols
        </Link>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-6">
        <For each={iconGroups}>
          {(group) => (
            <div class="space-y-3">
              <h3 class="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground opacity-70">
                {group.title}
              </h3>
              <div class="flex flex-wrap gap-2.5 w-full bg-foreground/[0.005] dark:bg-foreground/[0.02] p-8 rounded-2xl border border-foreground/10">
                <For each={group.icons}>
                  {(icon) => (
                    <Tooltip message={icon} position="top">
                      <div
                        onClick={() => props.onCopy(icon, "Icon Name")}
                        onKeyDown={(e) => e.key === "Enter" && props.onCopy(icon, "Icon Name")}
                        tabIndex={0}
                        role="button"
                        aria-label={`Copy icon name: ${icon}`}
                        class="group/icon flex items-center justify-center w-12 h-12 rounded-lg bg-foreground/[0.03] border border-foreground/10 hover:bg-foreground/[0.06] hover:border-primary/20 transition-[transform,shadow] duration-300 cursor-pointer active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                      >
                        <Icon name={icon} class="text-xl text-foreground group-hover/icon:scale-110 transition-transform duration-300 group-hover/icon:text-primary icon-fill-on-hover" />
                      </div>
                    </Tooltip>
                  )}
                </For>
              </div>
            </div>
          )}
        </For>
      </div>
    </section>
  );
}
